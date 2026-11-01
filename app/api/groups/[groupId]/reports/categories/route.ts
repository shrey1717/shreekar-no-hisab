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
      `SELECT COALESCE(expenses.category, ' uncategorized ') AS category,
              COUNT(*)::int AS expense_count,
              SUM(expenses.amount_minor)::text AS total_minor,
              groups.currency
       FROM expenses
       JOIN groups ON groups.id = expenses.group_id
       WHERE expenses.group_id = $1
         AND expenses.status = 'active'
         AND expenses.deleted_at IS NULL
       GROUP BY COALESCE(expenses.category, ' uncategorized '), groups.currency
       ORDER BY SUM(expenses.amount_minor) DESC`,
      [groupId],
    );
    return Response.json({
      categories: result.rows.map((row) => ({
        ...row,
        category: row.category.trim(),
      })),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
