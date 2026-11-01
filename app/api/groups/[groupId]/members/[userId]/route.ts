import { db } from "@/src/db/client";
import { ApiError, errorResponse, parseJson } from "@/src/lib/api-error";
import { requireMembership, requireRole } from "@/src/lib/group-auth";
import { groupIdSchema, updateMemberSchema } from "@/src/lib/group-schemas";

type MemberRouteContext = {
  params: Promise<{ groupId: string; userId: string }>;
};

export async function PATCH(request: Request, context: MemberRouteContext) {
  try {
    const { groupId, userId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success || !groupIdSchema.safeParse(userId).success) {
      throw new ApiError("INVALID_MEMBER_ID", "Group or member ID is invalid.", 400);
    }
    const { membership } = await requireMembership(request, groupId);
    requireRole(membership, ["owner"]);
    const parsed = updateMemberSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Role must be admin or member.", 400);
    }
    const result = await db.query(
      `UPDATE group_members
       SET role = $1
       WHERE group_id = $2 AND user_id = $3 AND left_at IS NULL
       RETURNING group_id, user_id, role`,
      [parsed.data.role, groupId, userId],
    );
    if (!result.rows[0]) {
      throw new ApiError("MEMBER_NOT_FOUND", "Active group member was not found.", 404);
    }
    return Response.json({ member: result.rows[0] });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: MemberRouteContext) {
  try {
    const { groupId, userId } = await context.params;
    const { membership } = await requireMembership(request, groupId);
    requireRole(membership, ["owner", "admin"]);
    if (membership.user_id === userId) {
      throw new ApiError("CANNOT_REMOVE_SELF", "You cannot remove yourself from the group.", 400);
    }
    const target = await db.query<{ role: string }>(
      `SELECT role FROM group_members
       WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [groupId, userId],
    );
    if (!target.rows[0]) {
      throw new ApiError("MEMBER_NOT_FOUND", "Active group member was not found.", 404);
    }
    if (membership.role === "admin" && target.rows[0].role !== "member") {
      throw new ApiError("GROUP_PERMISSION_DENIED", "Admins can only remove members.", 403);
    }
    await db.query(
      `UPDATE group_members SET left_at = NOW()
       WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId],
    );
    return Response.json({ success: true });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
