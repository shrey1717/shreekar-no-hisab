import { connection } from "next/server";
import { z } from "zod";
import { db } from "@/src/db/client";
import { requireUser } from "@/src/lib/group-auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";

const createEntrySchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  direction: z.enum(["gave", "got"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  props: { params: Promise<{ accountId: string }> }
) {
  await connection();
  try {
    const user = await requireUser(request);
    const { accountId } = await props.params;

    // Verify account belongs to user
    const accountCheck = await db.query(
      `SELECT id FROM accounts WHERE id = $1 AND user_id = $2`,
      [accountId, user.id]
    );

    if (accountCheck.rowCount === 0) {
      throw new ApiError("NOT_FOUND", "Account not found.", 404);
    }

    const body = await request.json();
    const parsed = createEntrySchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "INVALID_REQUEST",
        parsed.error.issues[0]?.message || "Invalid entry details.",
        400
      );
    }

    const amountMinor = Math.round(parsed.data.amount * 100);

    const result = await db.query(
      `INSERT INTO account_entries (account_id, user_id, amount_minor, direction, entry_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, account_id, amount_minor, direction, entry_date::text AS entry_date, notes, created_at`,
      [
        accountId,
        user.id,
        amountMinor,
        parsed.data.direction,
        parsed.data.date,
        parsed.data.notes || null,
      ]
    );

    // Update account updated_at
    await db.query(
      `UPDATE accounts SET updated_at = NOW() WHERE id = $1`,
      [accountId]
    );

    const row = result.rows[0];
    return Response.json({
      entry: {
        id: row.id,
        accountId: row.account_id,
        amount: Number(row.amount_minor) / 100,
        amountMinor: row.amount_minor,
        direction: row.direction,
        date: row.entry_date,
        notes: row.notes,
        createdAt: row.created_at,
      },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
