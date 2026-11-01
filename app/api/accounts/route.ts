import { connection } from "next/server";
import { z } from "zod";
import { db } from "@/src/db/client";
import { requireUser } from "@/src/lib/group-auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";

const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  type: z.enum(["customer", "supplier"]),
  phone: z.string().trim().max(30).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  await connection();
  try {
    const user = await requireUser(request);

    // Get all accounts
    const accountsResult = await db.query(
      `SELECT id, name, type, phone, notes, created_at
       FROM accounts
       WHERE user_id = $1
       ORDER BY updated_at DESC, created_at DESC`,
      [user.id]
    );

    // Get all entries for these accounts
    const entriesResult = await db.query(
      `SELECT id, account_id, amount_minor, direction, entry_date::text AS entry_date, notes, created_at
       FROM account_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC, created_at DESC`,
      [user.id]
    );

    const entriesByAccount = new Map<string, Array<{
      id: string;
      amount: number;
      amountMinor: string;
      direction: "gave" | "got";
      date: string;
      notes: string | null;
      createdAt: string;
    }>>();

    entriesResult.rows.forEach((row) => {
      const list = entriesByAccount.get(row.account_id) || [];
      list.push({
        id: row.id,
        amount: Number(row.amount_minor) / 100,
        amountMinor: row.amount_minor,
        direction: row.direction as "gave" | "got",
        date: row.entry_date,
        notes: row.notes,
        createdAt: row.created_at,
      });
      entriesByAccount.set(row.account_id, list);
    });

    const accounts = accountsResult.rows.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      phone: acc.phone,
      notes: acc.notes,
      entries: entriesByAccount.get(acc.id) || [],
    }));

    return Response.json({ accounts });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  await connection();
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "INVALID_REQUEST",
        parsed.error.issues[0]?.message || "Invalid account details.",
        400
      );
    }

    const result = await db.query(
      `INSERT INTO accounts (user_id, name, type, phone, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, type, phone, notes, created_at`,
      [
        user.id,
        parsed.data.name,
        parsed.data.type,
        parsed.data.phone || null,
        parsed.data.notes || null,
      ]
    );

    const row = result.rows[0];
    return Response.json({
      account: {
        id: row.id,
        name: row.name,
        type: row.type,
        phone: row.phone,
        notes: row.notes,
        entries: [],
      },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
