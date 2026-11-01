import { db } from "@/src/db/client";
import { ApiError, errorResponse, parseJson } from "@/src/lib/api-error";
import { requireUser } from "@/src/lib/group-auth";
import { createGroupSchema } from "@/src/lib/group-schemas";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const result = await db.query(
      `SELECT groups.id, groups.name, groups.description, groups.currency,
              groups.created_by, groups.created_at, groups.updated_at,
              group_members.role,
              COUNT(active_members.user_id)::int AS member_count
       FROM groups
       JOIN group_members
         ON group_members.group_id = groups.id
        AND group_members.user_id = $1
        AND group_members.left_at IS NULL
       LEFT JOIN group_members AS active_members
         ON active_members.group_id = groups.id
        AND active_members.left_at IS NULL
       WHERE groups.archived_at IS NULL
       GROUP BY groups.id, group_members.role
       ORDER BY groups.updated_at DESC`,
      [user.id],
    );

    return Response.json({ groups: result.rows });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const parsed = createGroupSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Enter a valid group name and currency.", 400);
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const group = await client.query(
        `INSERT INTO groups (name, description, currency, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, currency, created_by, created_at, updated_at`,
        [
          parsed.data.name,
          parsed.data.description ?? null,
          parsed.data.currency,
          user.id,
        ],
      );
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [group.rows[0].id, user.id],
      );
      await client.query("COMMIT");

      return Response.json(
        { group: { ...group.rows[0], role: "owner", member_count: 1 } },
        { status: 201 },
      );
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
