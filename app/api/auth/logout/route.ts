import { destroySession } from "@/src/lib/auth";
import { errorResponse } from "@/src/lib/api-error";

export async function POST() {
  try {
    await destroySession();
    return Response.json({ success: true });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
