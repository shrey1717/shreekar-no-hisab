import { db } from "@/src/db/client";
import { ApiError, errorResponse, parseJson } from "@/src/lib/api-error";
import { requireMembership } from "@/src/lib/group-auth";
import { groupIdSchema } from "@/src/lib/group-schemas";
import { createSettlementSchema } from "@/src/lib/settlement-schemas";

type SettlementsRouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(request: Request, context: SettlementsRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    await requireMembership(request, groupId);
    const result = await db.query(
      `SELECT settlements.id, settlements.group_id,
              settlements.from_user_id, from_user.name AS from_name,
              settlements.to_user_id, to_user.name AS to_name,
              settlements.amount_minor, settlements.currency,
              settlements.status, settlements.created_by,
              settlements.confirmed_at, settlements.cancelled_at,
              settlements.created_at
       FROM settlements
       JOIN users AS from_user ON from_user.id = settlements.from_user_id
       JOIN users AS to_user ON to_user.id = settlements.to_user_id
       WHERE settlements.group_id = $1
       ORDER BY settlements.created_at DESC`,
      [groupId],
    );
    return Response.json({ settlements: result.rows });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: SettlementsRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    const { user } = await requireMembership(request, groupId);
    const parsed = createSettlementSchema.safeParse(
      await parseJson<unknown>(request),
    );
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Settlement details are invalid.", 400);
    }
    if (parsed.data.fromUserId === parsed.data.toUserId) {
      throw new ApiError("INVALID_SETTLEMENT_USERS", "Settlement users must be different.", 422);
    }

    const amountMinor = BigInt(parsed.data.amountMinor);
    const members = await db.query<{ user_id: string; currency: string }>(
      `SELECT group_members.user_id, groups.currency
       FROM group_members
       JOIN groups ON groups.id = group_members.group_id
       WHERE group_members.group_id = $1
         AND group_members.user_id = ANY($2::uuid[])
         AND group_members.left_at IS NULL`,
      [groupId, [parsed.data.fromUserId, parsed.data.toUserId]],
    );
    if (members.rows.length !== 2) {
      throw new ApiError("INVALID_GROUP_MEMBER", "Both settlement users must belong to this group.", 422);
    }

    const result = await db.query(
      `INSERT INTO settlements
         (group_id, from_user_id, to_user_id, amount_minor, currency, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, group_id, from_user_id, to_user_id, amount_minor,
                 currency, status, created_by, created_at`,
      [
        groupId,
        parsed.data.fromUserId,
        parsed.data.toUserId,
        amountMinor.toString(),
        members.rows[0].currency,
        user.id,
      ],
    );
    await db.query(
      `INSERT INTO audit_events (group_id, actor_id, entity_type, entity_id, action)
       VALUES ($1, $2, 'settlement', $3, 'created')`,
      [groupId, user.id, result.rows[0].id],
    );
    return Response.json({ settlement: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
