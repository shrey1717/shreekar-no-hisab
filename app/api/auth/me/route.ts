import { connection } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { errorResponse } from "@/src/lib/api-error";

export async function GET(request: Request) {
  await connection();
  try {
    const user = await getCurrentUser(request);
    return Response.json({ user });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
