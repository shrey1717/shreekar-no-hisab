import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/src/db/client";

const sessionCookieName = "paisanakhne_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await db.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await db.query("DELETE FROM sessions WHERE token_hash = $1", [
      hashToken(token),
    ]);
  }

  cookieStore.delete(sessionCookieName);
}

function getCookieValue(request: Request, name: string): string | undefined {
  const cookiesHeader = request.headers.get("cookie");
  const cookie = cookiesHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie?.slice(name.length + 1);
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const token = getCookieValue(request, sessionCookieName);

  if (!token) {
    return null;
  }

  const result = await db.query<AuthUser>(
    `SELECT users.id, users.name, users.email
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > NOW()
       AND users.deleted_at IS NULL`,
    [hashToken(token)],
  );

  return result.rows[0] ?? null;
}

export { sessionCookieName };
