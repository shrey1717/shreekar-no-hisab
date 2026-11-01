import { db } from "@/src/db/client";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { requireMembership } from "@/src/lib/group-auth";
import { groupIdSchema } from "@/src/lib/group-schemas";

type HistoryRouteContext = { params: Promise<{ groupId: string }> };

function pagination(request: Request) {
  const url = new URL(request.url);
  const limitValue = Number(url.searchParams.get("limit") ?? 50);
  const offsetValue = Number(url.searchParams.get("offset") ?? 0);
  if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 ||
      !Number.isInteger(offsetValue) || offsetValue < 0) {
    throw new ApiError("INVALID_PAGINATION", "Limit must be 1-100 and offset must be non-negative.", 400);
  }
  return { limit: limitValue, offset: offsetValue };
}

export async function GET(request: Request, context: HistoryRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    await requireMembership(request, groupId);
    const { limit, offset } = pagination(request);
    const result = await db.query(
      `SELECT history.id, history.type, history.entity_id, history.title,
              history.amount_minor, history.currency, history.status,
              history.actor_id, history.actor_name, history.occurred_at
       FROM (
         SELECT expenses.id, 'expense' AS type, expenses.id AS entity_id,
                expenses.title, expenses.amount_minor::text AS amount_minor,
                expenses.currency, expenses.status, expenses.created_by AS actor_id,
                creator.name AS actor_name, expenses.created_at AS occurred_at
         FROM expenses
         JOIN users AS creator ON creator.id = expenses.created_by
         WHERE expenses.group_id = $1 AND expenses.deleted_at IS NULL
         UNION ALL
         SELECT settlements.id, 'settlement' AS type, settlements.id AS entity_id,
                'Settlement' AS title, settlements.amount_minor::text,
                settlements.currency, settlements.status,
                settlements.created_by AS actor_id, creator.name,
                settlements.created_at
         FROM settlements
         JOIN users AS creator ON creator.id = settlements.created_by
         WHERE settlements.group_id = $1
       ) AS history
       ORDER BY history.occurred_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset],
    );
    return Response.json({ history: result.rows, limit, offset });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
