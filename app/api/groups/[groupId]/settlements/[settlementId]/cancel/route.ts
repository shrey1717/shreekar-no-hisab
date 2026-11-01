import { db } from "@/src/db/client";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { requireMembership } from "@/src/lib/group-auth";
import { validateSettlementIds } from "@/src/lib/settlement-route";

type SettlementRouteContext = {
  params: Promise<{ groupId: string; settlementId: string }>;
};

export async function POST(request: Request, context: SettlementRouteContext) {
  try {
    const { groupId, settlementId } = await context.params;
    validateSettlementIds(groupId, settlementId);
    const { user, membership } = await requireMembership(request, groupId);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<{
        status: string;
        created_by: string;
        from_user_id: string;
        to_user_id: string;
      }>(
        `SELECT status, created_by, from_user_id, to_user_id
         FROM settlements
         WHERE id = $1 AND group_id = $2
         FOR UPDATE`,
        [settlementId, groupId],
      );
      if (!current.rows[0]) {
        throw new ApiError("SETTLEMENT_NOT_FOUND", "Settlement was not found.", 404);
      }
      if (current.rows[0].status !== "pending") {
        throw new ApiError("SETTLEMENT_NOT_PENDING", "Only pending settlements can be cancelled.", 409);
      }
      const settlement = current.rows[0];
      const canAct = membership.role === "owner"
        || membership.role === "admin"
        || settlement.created_by === user.id
        || settlement.from_user_id === user.id
        || settlement.to_user_id === user.id;
      if (!canAct) {
        throw new ApiError("SETTLEMENT_PERMISSION_DENIED", "Only the settlement participants, creator, or group administrators can cancel it.", 403);
      }
      const result = await client.query(
        `UPDATE settlements
         SET status = 'cancelled', cancelled_at = NOW()
         WHERE id = $1 AND group_id = $2
         RETURNING id, group_id, from_user_id, to_user_id, amount_minor,
                   currency, status, created_by, cancelled_at, created_at`,
        [settlementId, groupId],
      );
      await client.query(
        `INSERT INTO audit_events (group_id, actor_id, entity_type, entity_id, action)
         VALUES ($1, $2, 'settlement', $3, 'cancelled')`,
        [groupId, user.id, settlementId],
      );
      await client.query("COMMIT");
      return Response.json({ settlement: result.rows[0] });
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
