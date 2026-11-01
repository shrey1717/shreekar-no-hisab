import { db } from "@/src/db/client";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { requireMembership } from "@/src/lib/group-auth";
import { groupIdSchema } from "@/src/lib/group-schemas";

type ReportRouteContext = { params: Promise<{ groupId: string }> };

export async function GET(request: Request, context: ReportRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    await requireMembership(request, groupId);
    const result = await db.query(
      `SELECT groups.currency,
              COUNT(expenses.id)::int AS expense_count,
              COALESCE(SUM(expenses.amount_minor), 0)::text AS total_expense_minor,
              COUNT(DISTINCT expenses.payer_id)::int AS payer_count,
              (
                SELECT COUNT(*)::int
                FROM group_members
                WHERE group_members.group_id = $1
                  AND group_members.left_at IS NULL
              ) AS member_count,
              (
                SELECT COUNT(*)::int
                FROM settlements
                WHERE settlements.group_id = $1
                  AND settlements.status = 'confirmed'
              ) AS confirmed_settlement_count,
              (
                SELECT COALESCE(SUM(amount_minor), 0)::text
                FROM settlements
                WHERE settlements.group_id = $1
                  AND settlements.status = 'confirmed'
              ) AS confirmed_settlement_minor
       FROM groups
       LEFT JOIN expenses
         ON expenses.group_id = groups.id
        AND expenses.status = 'active'
        AND expenses.deleted_at IS NULL
       WHERE groups.id = $1
       GROUP BY groups.id, groups.currency`,
      [groupId],
    );
    if (!result.rows[0]) {
      throw new ApiError("GROUP_NOT_FOUND", "Group was not found.", 404);
    }
    return Response.json({ summary: result.rows[0] });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
