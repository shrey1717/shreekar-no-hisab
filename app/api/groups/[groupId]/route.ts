import { db } from "@/src/db/client";
import { ApiError, errorResponse, parseJson } from "@/src/lib/api-error";
import { requireMembership, requireRole } from "@/src/lib/group-auth";
import { groupIdSchema, updateGroupSchema } from "@/src/lib/group-schemas";

type GroupRouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(request: Request, context: GroupRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    await requireMembership(request, groupId);
    const result = await db.query(
      `SELECT id, name, description, currency, created_by, created_at,
              updated_at, archived_at
       FROM groups
       WHERE id = $1`,
      [groupId],
    );
    if (!result.rows[0]) {
      throw new ApiError("GROUP_NOT_FOUND", "Group was not found.", 404);
    }
    return Response.json({ group: result.rows[0] });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: GroupRouteContext) {
  try {
    const { groupId } = await context.params;
    if (!groupIdSchema.safeParse(groupId).success) {
      throw new ApiError("INVALID_GROUP_ID", "Group ID is invalid.", 400);
    }
    const { membership } = await requireMembership(request, groupId);
    requireRole(membership, ["owner", "admin"]);
    const parsed = updateGroupSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Enter valid group update fields.", 400);
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    if (parsed.data.name !== undefined) {
      fields.push(`name = $${values.length + 1}`);
      values.push(parsed.data.name);
    }
    if (parsed.data.description !== undefined) {
      fields.push(`description = $${values.length + 1}`);
      values.push(parsed.data.description);
    }
    if (parsed.data.archived !== undefined) {
      fields.push(`archived_at = $${values.length + 1}`);
      values.push(parsed.data.archived ? new Date() : null);
    }
    values.push(groupId);
    const result = await db.query(
      `UPDATE groups
       SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, name, description, currency, created_by, created_at,
                 updated_at, archived_at`,
      values,
    );
    return Response.json({ group: result.rows[0] });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
