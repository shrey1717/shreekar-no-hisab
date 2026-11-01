import { db } from "@/src/db/client";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { requireMembership } from "@/src/lib/group-auth";
import { groupIdSchema } from "@/src/lib/group-schemas";

type MembersRouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(request: Request, context: MembersRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    await requireMembership(request, groupId);
    const result = await db.query(
      `SELECT users.id, users.name, users.email, group_members.role,
              group_members.joined_at
       FROM group_members
       JOIN users ON users.id = group_members.user_id
       WHERE group_members.group_id = $1
         AND group_members.left_at IS NULL
       ORDER BY group_members.joined_at ASC`,
      [groupId],
    );
    return Response.json({ members: result.rows });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
