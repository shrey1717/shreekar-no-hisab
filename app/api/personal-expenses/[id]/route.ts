import { connection } from "next/server";
import { db } from "@/src/db/client";
import { requireUser } from "@/src/lib/group-auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  await connection();
  try {
    const user = await requireUser(request);
    const { id } = await props.params;

    const result = await db.query(
      `DELETE FROM personal_expenses
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      throw new ApiError("NOT_FOUND", "Expense not found or already deleted.", 404);
    }

    return Response.json({ success: true, id });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
