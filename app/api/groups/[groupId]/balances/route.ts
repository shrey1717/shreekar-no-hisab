import { db } from "@/src/db/client";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { requireMembership } from "@/src/lib/group-auth";
import { groupIdSchema } from "@/src/lib/group-schemas";
import {
  calculateSettlementSuggestions,
  type BalanceEntry,
} from "@/src/lib/balance-calculation";

type BalancesRouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(request: Request, context: BalancesRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }

    await requireMembership(request, groupId);
    const result = await db.query<{
      user_id: string;
      name: string;
      currency: string;
      net_minor: string;
    }>(
      `WITH active_members AS (
        SELECT group_members.user_id, users.name
        FROM group_members
        JOIN users ON users.id = group_members.user_id
        WHERE group_members.group_id = $1
          AND group_members.left_at IS NULL
          AND users.deleted_at IS NULL
      ),
      paid AS (
        SELECT payer_id AS user_id, SUM(amount_minor) AS amount
        FROM expenses
        WHERE group_id = $1 AND status = 'active' AND deleted_at IS NULL
        GROUP BY payer_id
      ),
      owed AS (
        SELECT expense_splits.user_id, SUM(expense_splits.share_minor) AS amount
        FROM expense_splits
        JOIN expenses ON expenses.id = expense_splits.expense_id
        WHERE expenses.group_id = $1
          AND expenses.status = 'active'
          AND expenses.deleted_at IS NULL
        GROUP BY expense_splits.user_id
      ),
      sent AS (
        SELECT from_user_id AS user_id, SUM(amount_minor) AS amount
        FROM settlements
        WHERE group_id = $1 AND status = 'confirmed'
        GROUP BY from_user_id
      ),
      received AS (
        SELECT to_user_id AS user_id, SUM(amount_minor) AS amount
        FROM settlements
        WHERE group_id = $1 AND status = 'confirmed'
        GROUP BY to_user_id
      )
      SELECT active_members.user_id, active_members.name,
             groups.currency,
             (
               COALESCE(paid.amount, 0)
               - COALESCE(owed.amount, 0)
               + COALESCE(sent.amount, 0)
               - COALESCE(received.amount, 0)
             )::text AS net_minor
      FROM active_members
      CROSS JOIN groups
      LEFT JOIN paid ON paid.user_id = active_members.user_id
      LEFT JOIN owed ON owed.user_id = active_members.user_id
      LEFT JOIN sent ON sent.user_id = active_members.user_id
      LEFT JOIN received ON received.user_id = active_members.user_id
      WHERE groups.id = $1
      ORDER BY active_members.name ASC`,
      [groupId],
    );

    const balances: BalanceEntry[] = result.rows.map((row) => ({
      userId: row.user_id,
      name: row.name,
      netMinor: BigInt(row.net_minor),
    }));
    const suggestions = calculateSettlementSuggestions(balances);

    return Response.json({
      currency: result.rows[0]?.currency ?? "INR",
      balances: balances.map((balance) => ({
        userId: balance.userId,
        name: balance.name,
        netMinor: balance.netMinor.toString(),
      })),
      settlementSuggestions: suggestions.map((suggestion) => ({
        fromUserId: suggestion.fromUserId,
        fromName: suggestion.fromName,
        toUserId: suggestion.toUserId,
        toName: suggestion.toName,
        amountMinor: suggestion.amountMinor.toString(),
      })),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
