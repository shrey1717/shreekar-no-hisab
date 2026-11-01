import { db } from "@/src/db/client";
import { ApiError } from "@/src/lib/api-error";
import { AuthUser, getCurrentUser } from "@/src/lib/auth";

export type GroupRole = "owner" | "admin" | "member";

export type GroupMembership = {
  group_id: string;
  user_id: string;
  role: GroupRole;
};

export async function requireUser(request: Request): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new ApiError("UNAUTHENTICATED", "You must be signed in.", 401);
  }

  return user;
}

export async function requireMembership(
  request: Request,
  groupId: string,
): Promise<{ user: AuthUser; membership: GroupMembership }> {
  const user = await requireUser(request);
  const result = await db.query<GroupMembership>(
    `SELECT group_id, user_id, role
     FROM group_members
     WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [groupId, user.id],
  );

  const membership = result.rows[0];
  if (!membership) {
    throw new ApiError("GROUP_ACCESS_DENIED", "You are not a member of this group.", 403);
  }

  return { user, membership };
}

export function requireRole(
  membership: GroupMembership,
  roles: GroupRole[],
): void {
  if (!roles.includes(membership.role)) {
    throw new ApiError("GROUP_PERMISSION_DENIED", "You do not have permission for this action.", 403);
  }
}
