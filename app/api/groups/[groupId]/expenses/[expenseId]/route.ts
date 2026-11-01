import { db } from "@/src/db/client";
import { ApiError, errorResponse, parseJson } from "@/src/lib/api-error";
import { requireMembership, requireRole } from "@/src/lib/group-auth";
import { groupIdSchema } from "@/src/lib/group-schemas";
import { updateExpenseSchema } from "@/src/lib/expense-schemas";

type ExpenseRouteContext = {
  params: Promise<{ groupId: string; expenseId: string }>;
};

function validateIds(groupId: string, expenseId: string): void {
  if (!groupIdSchema.safeParse(groupId).success || !groupIdSchema.safeParse(expenseId).success) {
    throw new ApiError("INVALID_EXPENSE_ID", "Group or expense ID is invalid.", 400);
  }
}

export async function GET(request: Request, context: ExpenseRouteContext) {
  try {
    const { groupId, expenseId } = await context.params;
    validateIds(groupId, expenseId);
    await requireMembership(request, groupId);
    const result = await db.query(
      `SELECT expenses.id, expenses.title, expenses.amount_minor,
              expenses.currency, expenses.category, expenses.expense_date,
              expenses.split_type, expenses.status, expenses.created_at,
              expenses.updated_at, expenses.payer_id, payer.name AS payer_name,
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
       WHERE expenses.id = $1 AND expenses.group_id = $2
         AND expenses.deleted_at IS NULL
       GROUP BY expenses.id, payer.name`,
      [expenseId, groupId],
    );
    if (!result.rows[0]) {
      throw new ApiError("EXPENSE_NOT_FOUND", "Expense was not found.", 404);
    }
    return Response.json({ expense: result.rows[0] });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: ExpenseRouteContext) {
  try {
    const { groupId, expenseId } = await context.params;
    validateIds(groupId, expenseId);
    const { user, membership } = await requireMembership(request, groupId);
    const existing = await db.query<{ created_by: string }>(
      `SELECT created_by FROM expenses
       WHERE id = $1 AND group_id = $2 AND deleted_at IS NULL`,
      [expenseId, groupId],
    );
    if (!existing.rows[0]) {
      throw new ApiError("EXPENSE_NOT_FOUND", "Expense was not found.", 404);
    }
    if (existing.rows[0].created_by !== user.id) {
      requireRole(membership, ["owner", "admin"]);
    }
    const parsed = updateExpenseSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Expense update fields are invalid.", 400);
    }
    const result = await db.query(
      `UPDATE expenses
       SET title = COALESCE($1, title),
           category = CASE WHEN $2::boolean THEN $3 ELSE category END,
           expense_date = COALESCE($4, expense_date),
           updated_at = NOW()
       WHERE id = $5 AND group_id = $6 AND deleted_at IS NULL
       RETURNING id, group_id, title, amount_minor, currency, category,
                 expense_date, split_type, status, created_at, updated_at`,
      [
        parsed.data.title ?? null,
        parsed.data.category !== undefined,
        parsed.data.category ?? null,
        parsed.data.expenseDate ?? null,
        expenseId,
        groupId,
      ],
    );
    await db.query(
      `INSERT INTO audit_events (group_id, actor_id, entity_type, entity_id, action)
       VALUES ($1, $2, 'expense', $3, 'updated')`,
      [groupId, user.id, expenseId],
    );
    return Response.json({ expense: result.rows[0] });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: ExpenseRouteContext) {
  try {
    const { groupId, expenseId } = await context.params;
    validateIds(groupId, expenseId);
    const { user, membership } = await requireMembership(request, groupId);
    const existing = await db.query<{ created_by: string }>(
      `SELECT created_by FROM expenses
       WHERE id = $1 AND group_id = $2 AND deleted_at IS NULL`,
      [expenseId, groupId],
    );
    if (!existing.rows[0]) {
      throw new ApiError("EXPENSE_NOT_FOUND", "Expense was not found.", 404);
    }
    if (existing.rows[0].created_by !== user.id) {
      requireRole(membership, ["owner", "admin"]);
    }
    await db.query(
      `UPDATE expenses
       SET status = 'voided', deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND group_id = $2`,
      [expenseId, groupId],
    );
    await db.query(
      `INSERT INTO audit_events (group_id, actor_id, entity_type, entity_id, action)
       VALUES ($1, $2, 'expense', $3, 'voided')`,
      [groupId, user.id, expenseId],
    );
    return Response.json({ success: true });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
