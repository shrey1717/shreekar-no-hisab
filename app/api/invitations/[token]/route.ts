import { db } from "@/src/db/client";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { hashToken } from "@/src/lib/auth";
import { requireUser } from "@/src/lib/group-auth";

type InvitationRouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: InvitationRouteContext) {
  try {
    const user = await requireUser(request);
    const { token } = await context.params;
    if (!token || token.length < 20) {
      throw new ApiError("INVALID_INVITATION", "Invitation token is invalid.", 400);
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const invitation = await client.query<{
        id: string;
        group_id: string;
        group_name: string;
        expires_at: Date | null;
        max_uses: number | null;
        uses_count: number;
      }>(
        `SELECT group_invitations.id, group_invitations.group_id,
                groups.name AS group_name, group_invitations.expires_at,
                group_invitations.max_uses, group_invitations.uses_count
         FROM group_invitations
         JOIN groups ON groups.id = group_invitations.group_id
         WHERE group_invitations.token_hash = $1
           AND group_invitations.revoked_at IS NULL
         FOR UPDATE`,
        [hashToken(token)],
      );
      const invite = invitation.rows[0];
      if (
        !invite ||
        (invite.expires_at && invite.expires_at <= new Date()) ||
        (invite.max_uses !== null && invite.uses_count >= invite.max_uses)
      ) {
        throw new ApiError("INVITATION_UNAVAILABLE", "This invitation is expired or unavailable.", 410);
      }

      const existing = await client.query(
        `SELECT 1 FROM group_members
         WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [invite.group_id, user.id],
      );
      if (existing.rowCount !== 0) {
        throw new ApiError("ALREADY_GROUP_MEMBER", "You are already a member of this group.", 409);
      }

      await client.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (group_id, user_id)
         DO UPDATE SET role = 'member', left_at = NULL, joined_at = NOW()`,
        [invite.group_id, user.id],
      );
      await client.query(
        `UPDATE group_invitations
         SET uses_count = uses_count + 1
         WHERE id = $1`,
        [invite.id],
      );
      await client.query("COMMIT");

      return Response.json({
        group: { id: invite.group_id, name: invite.group_name },
      });
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
