import { connection } from "next/server";
import { z } from "zod";
import { db } from "@/src/db/client";
import { requireUser } from "@/src/lib/group-auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";

const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.string().trim().min(1).default("Food"),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  notes: z.string().max(500).optional(),
});

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export async function GET(request: Request) {
  await connection();
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const selectedYear = url.searchParams.get("year") || String(new Date().getFullYear());
    const selectedMonth = url.searchParams.get("month"); // e.g. "2026-10" or "all"
    const selectedCategory = url.searchParams.get("category");

    // 1. Fetch distinct years with expenses
    const yearsResult = await db.query<{ yr: number }>(
      `SELECT DISTINCT EXTRACT(YEAR FROM expense_date)::int AS yr
       FROM personal_expenses
       WHERE user_id = $1
       ORDER BY yr DESC`,
      [user.id]
    );

    const currentYear = new Date().getFullYear();
    const existingYears = yearsResult.rows.map((r) => r.yr);
    if (!existingYears.includes(currentYear)) {
      existingYears.unshift(currentYear);
    }
    const allYears = Array.from(new Set(existingYears)).sort((a, b) => b - a);

    // 2. Fetch expenses list
    let query = `
      SELECT id, title, amount_minor, currency, category,
             expense_date::text AS expense_date, notes, created_at
      FROM personal_expenses
      WHERE user_id = $1
    `;
    const params: (string | number)[] = [user.id];

    if (selectedYear !== "all") {
      params.push(Number(selectedYear));
      query += ` AND EXTRACT(YEAR FROM expense_date) = $${params.length}`;
    }

    if (selectedMonth && selectedMonth !== "all") {
      params.push(`${selectedMonth}%`);
      query += ` AND expense_date::text LIKE $${params.length}`;
    }

    if (selectedCategory && selectedCategory !== "all") {
      params.push(selectedCategory);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY expense_date DESC, created_at DESC`;

    const expensesResult = await db.query(query, params);
    const expenses = expensesResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      amount: Number(row.amount_minor) / 100,
      amountMinor: row.amount_minor,
      currency: row.currency,
      category: row.category,
      expenseDate: row.expense_date,
      notes: row.notes,
      createdAt: row.created_at,
    }));

    // 3. 12-month breakdown for the selected year
    const targetYearNum = selectedYear === "all" ? currentYear : Number(selectedYear);
    const monthlyAggResult = await db.query<{
      mo: number;
      total_minor: string;
      entry_count: string;
    }>(
      `SELECT EXTRACT(MONTH FROM expense_date)::int AS mo,
              COALESCE(SUM(amount_minor), 0)::text AS total_minor,
              COUNT(*)::text AS entry_count
       FROM personal_expenses
       WHERE user_id = $1 AND EXTRACT(YEAR FROM expense_date) = $2
       GROUP BY mo
       ORDER BY mo ASC`,
      [user.id, targetYearNum]
    );

    const monthlyMap = new Map<number, { totalMinor: number; count: number }>();
    monthlyAggResult.rows.forEach((r) => {
      monthlyMap.set(r.mo, {
        totalMinor: Number(r.total_minor),
        count: Number(r.entry_count),
      });
    });

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthStr = String(monthNum).padStart(2, "0");
      const monthKey = `${targetYearNum}-${monthStr}`;
      const data = monthlyMap.get(monthNum) || { totalMinor: 0, count: 0 };
      return {
        monthNumber: monthNum,
        monthKey,
        monthName: monthNames[i],
        totalMinor: data.totalMinor,
        totalAmount: data.totalMinor / 100,
        count: data.count,
      };
    });

    // 4. Yearly Category breakdown
    const categoryAggResult = await db.query<{
      category: string;
      total_minor: string;
      entry_count: string;
    }>(
      `SELECT category,
              COALESCE(SUM(amount_minor), 0)::text AS total_minor,
              COUNT(*)::text AS entry_count
       FROM personal_expenses
       WHERE user_id = $1 AND EXTRACT(YEAR FROM expense_date) = $2
       GROUP BY category
       ORDER BY SUM(amount_minor) DESC`,
      [user.id, targetYearNum]
    );

    const categoryBreakdown = categoryAggResult.rows.map((row) => ({
      category: row.category,
      totalMinor: Number(row.total_minor),
      totalAmount: Number(row.total_minor) / 100,
      count: Number(row.entry_count),
    }));

    // 5. Multi-year comparison
    const allYearsAggResult = await db.query<{
      yr: number;
      total_minor: string;
      entry_count: string;
    }>(
      `SELECT EXTRACT(YEAR FROM expense_date)::int AS yr,
              COALESCE(SUM(amount_minor), 0)::text AS total_minor,
              COUNT(*)::text AS entry_count
       FROM personal_expenses
       WHERE user_id = $1
       GROUP BY yr
       ORDER BY yr DESC`,
      [user.id]
    );

    const allYearsSummary = allYearsAggResult.rows.map((row) => ({
      year: row.yr,
      totalMinor: Number(row.total_minor),
      totalAmount: Number(row.total_minor) / 100,
      count: Number(row.entry_count),
    }));

    const totalYearMinor = monthlyBreakdown.reduce((sum, m) => sum + m.totalMinor, 0);
    const totalYearCount = monthlyBreakdown.reduce((sum, m) => sum + m.count, 0);

    return Response.json({
      expenses,
      allYears,
      selectedYear: targetYearNum,
      selectedMonth,
      monthlyBreakdown,
      categoryBreakdown,
      allYearsSummary,
      yearStats: {
        totalMinor: totalYearMinor,
        totalAmount: totalYearMinor / 100,
        count: totalYearCount,
        averageMonthlyAmount: totalYearMinor > 0 ? (totalYearMinor / 100) / 12 : 0,
      },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  await connection();
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "INVALID_REQUEST",
        parsed.error.issues[0]?.message || "Invalid expense details.",
        400
      );
    }

    const amountMinor = Math.round(parsed.data.amount * 100);

    const result = await db.query(
      `INSERT INTO personal_expenses (user_id, title, amount_minor, category, expense_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, amount_minor, currency, category, expense_date::text AS expense_date, notes, created_at`,
      [
        user.id,
        parsed.data.title,
        amountMinor,
        parsed.data.category,
        parsed.data.expenseDate,
        parsed.data.notes || null,
      ]
    );

    const row = result.rows[0];
    return Response.json({
      expense: {
        id: row.id,
        title: row.title,
        amount: Number(row.amount_minor) / 100,
        amountMinor: row.amount_minor,
        currency: row.currency,
        category: row.category,
        expenseDate: row.expense_date,
        notes: row.notes,
        createdAt: row.created_at,
      },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
