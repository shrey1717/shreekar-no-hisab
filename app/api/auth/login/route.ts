import argon2 from "argon2";
import { db } from "@/src/db/client";
import { buildSessionCookieHeader, createSession } from "@/src/lib/auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { loginSchema } from "@/src/lib/auth-schemas";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());

    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Enter a valid email and password.", 400);
    }

    const result = await db.query<{
      id: string;
      name: string;
      email: string;
      password_hash: string | null;
    }>(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE LOWER(email) = $1
         AND deleted_at IS NULL`,
      [parsed.data.email.toLowerCase()],
    );
    const user = result.rows[0];
    const validPassword =
      user && user.password_hash
        ? await argon2.verify(user.password_hash, parsed.data.password)
        : false;

    if (!user || !validPassword) {
      throw new ApiError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }

    const sessionToken = await createSession(user.id);
    const response = Response.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
    response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken));
    return response;
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
