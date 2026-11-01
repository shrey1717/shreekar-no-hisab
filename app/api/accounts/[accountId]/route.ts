import { connection } from "next/server";
import { db } from "@/src/db/client";
import { requireUser } from "@/src/lib/group-auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ accountId: string }> }
) {
  await connection();
  try {
    const user = await requireUser(request);
    const { accountId } = await props.params;

    const result = await db.query(
      `DELETE FROM accounts
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [accountId, user.id]
    );

    if (result.rowCount === 0) {
      throw new ApiError("NOT_FOUND", "Account not found or already deleted.", 404);
    }

    return Response.json({ success: true, id: accountId });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
