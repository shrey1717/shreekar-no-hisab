import { db } from "@/src/db/client";
import { ApiError, errorResponse, parseJson } from "@/src/lib/api-error";
import { requireMembership } from "@/src/lib/group-auth";
import { groupIdSchema } from "@/src/lib/group-schemas";
import { createExpenseSchema, minorToBigInt } from "@/src/lib/expense-schemas";
import {
  calculateEqualSplits,
  validateCustomSplits,
  type ExpenseSplit,
} from "@/src/lib/expense-splitting";

type ExpensesRouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(request: Request, context: ExpensesRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    await requireMembership(request, groupId);
    const result = await db.query(
      `SELECT expenses.id, expenses.title, expenses.amount_minor,
              expenses.currency, expenses.category, expenses.expense_date,
              expenses.split_type, expenses.status, expenses.created_at,
              expenses.updated_at, expenses.payer_id,
              payer.name AS payer_name,
              COALESCE(
                json_agg(
                  json_build_object(
                    'userId', expense_splits.user_id,
                    'name', split_user.name,
                    'shareMinor', expense_splits.share_minor
                  ) ORDER BY split_user.name
                ) FILTER (WHERE expense_splits.id IS NOT NULL),
                '[]'
              ) AS splits
       FROM expenses
       JOIN users AS payer ON payer.id = expenses.payer_id
       LEFT JOIN expense_splits ON expense_splits.expense_id = expenses.id
       LEFT JOIN users AS split_user ON split_user.id = expense_splits.user_id
       WHERE expenses.group_id = $1 AND expenses.deleted_at IS NULL
       GROUP BY expenses.id, payer.name
       ORDER BY expenses.expense_date DESC, expenses.created_at DESC`,
      [groupId],
    );
    return Response.json({ expenses: result.rows });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: ExpensesRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    const { user } = await requireMembership(request, groupId);
    const parsed = createExpenseSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Expense details are invalid.", 400);
    }

    const amountMinor = minorToBigInt(parsed.data.amountMinor);
    const splits: ExpenseSplit[] = parsed.data.splitType === "equal"
      ? calculateEqualSplits(amountMinor, parsed.data.participantIds ?? [])
      : (parsed.data.splits ?? []).map((split) => ({
          userId: split.userId,
          shareMinor: minorToBigInt(split.shareMinor),
        }));

    if (new Set(splits.map((split) => split.userId)).size !== splits.length) {
      throw new ApiError("DUPLICATE_SPLIT_MEMBER", "Each participant can appear only once.", 400);
    }
    if (parsed.data.splitType === "custom") {
      try {
        validateCustomSplits(amountMinor, splits);
      } catch {
        throw new ApiError("SPLIT_TOTAL_MISMATCH", "Expense splits must equal the total amount.", 422);
      }
    }

    const participantIds = splits.map((split) => split.userId);
    if (!participantIds.includes(parsed.data.payerId)) {
      throw new ApiError("PAYER_NOT_INCLUDED", "The payer must be included in the expense split.", 422);
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const members = await client.query<{ user_id: string; currency: string }>(
        `SELECT group_members.user_id, groups.currency
         FROM group_members
         JOIN groups ON groups.id = group_members.group_id
         WHERE group_members.group_id = $1
           AND group_members.user_id = ANY($2::uuid[])
           AND group_members.left_at IS NULL`,
        [groupId, [...new Set([parsed.data.payerId, ...participantIds])]],
      );
      const requiredIds = new Set([parsed.data.payerId, ...participantIds]);
      if (members.rows.length !== requiredIds.size) {
        throw new ApiError("INVALID_GROUP_MEMBER", "Payer and participants must belong to this group.", 422);
      }
      const expense = await client.query(
        `INSERT INTO expenses
           (group_id, created_by, payer_id, title, amount_minor, currency,
            category, expense_date, split_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, group_id, created_by, payer_id, title, amount_minor,
                   currency, category, expense_date, split_type, status,
                   created_at, updated_at`,
        [
          groupId,
          user.id,
          parsed.data.payerId,
          parsed.data.title,
          amountMinor.toString(),
          members.rows[0].currency,
          parsed.data.category ?? null,
          parsed.data.expenseDate,
          parsed.data.splitType,
        ],
      );
      for (const split of splits) {
        await client.query(
          `INSERT INTO expense_splits (expense_id, user_id, share_minor)
           VALUES ($1, $2, $3)`,
          [expense.rows[0].id, split.userId, split.shareMinor.toString()],
        );
      }
      await client.query(
        `INSERT INTO audit_events (group_id, actor_id, entity_type, entity_id, action)
         VALUES ($1, $2, 'expense', $3, 'created')`,
        [groupId, user.id, expense.rows[0].id],
      );
      await client.query("COMMIT");
      return Response.json(
        {
          expense: {
            ...expense.rows[0],
            splits: splits.map((split) => ({
              userId: split.userId,
              shareMinor: split.shareMinor.toString(),
            })),
          },
        },
        { status: 201 },
      );
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
