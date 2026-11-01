import { randomBytes } from "node:crypto";
import { db } from "@/src/db/client";
import { ApiError, errorResponse, parseJson } from "@/src/lib/api-error";
import { hashToken } from "@/src/lib/auth";
import { requireMembership, requireRole } from "@/src/lib/group-auth";
import { createInvitationSchema, groupIdSchema } from "@/src/lib/group-schemas";

type InviteRouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function POST(request: Request, context: InviteRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    const { user, membership } = await requireMembership(request, groupId);
    requireRole(membership, ["owner", "admin"]);
    const parsed = createInvitationSchema.safeParse(
      await parseJson<unknown>(request),
    );
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invitation options are invalid.", 400);
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000,
    );
    const result = await db.query(
      `INSERT INTO group_invitations
         (group_id, created_by, token_hash, expires_at, max_uses)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, group_id, expires_at, max_uses, created_at`,
      [
        groupId,
        user.id,
        hashToken(token),
        expiresAt,
        parsed.data.maxUses ?? null,
      ],
    );

    return Response.json(
      {
        invitation: {
          ...result.rows[0],
          token,
          url: `/invitations/${token}`,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
