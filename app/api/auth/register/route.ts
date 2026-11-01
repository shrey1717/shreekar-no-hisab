import argon2 from "argon2";
import { db } from "@/src/db/client";
import { buildSessionCookieHeader, createSession } from "@/src/lib/auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";
import { registerSchema } from "@/src/lib/auth-schemas";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());

    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Enter a valid name, email, and password.", 400);
    }

    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const passwordHash = await argon2.hash(parsed.data.password);
    const client = await db.connect();
    let transactionOpen = false;

    try {
      await client.query("BEGIN");
      transactionOpen = true;
      const result = await client.query<{ id: string; name: string; email: string }>(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [name, email, passwordHash],
      );
      await client.query("COMMIT");
      transactionOpen = false;
      const sessionToken = await createSession(result.rows[0].id);
      const response = Response.json({ user: result.rows[0] }, { status: 201 });
      response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken));
      return response;
    } catch (error: unknown) {
      if (transactionOpen) {
        await client.query("ROLLBACK");
      }
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new ApiError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
