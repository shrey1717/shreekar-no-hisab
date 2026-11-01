import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/src/db/client";

const sessionCookieName = "paisanakhne_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30; // 30 days persistent

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildSessionCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${isProd ? "; Secure" : ""}`;
}

export async function findOrCreateGoogleUser({
  email,
  name,
  googleId,
  avatarUrl,
}: {
  email: string;
  name: string;
  googleId?: string;
  avatarUrl?: string;
}): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const userName = (name || "").trim() || normalizedEmail.split("@")[0];

  const existing = await db.query<AuthUser>(
    `SELECT id, name, email, avatar_url
     FROM users
     WHERE LOWER(email) = $1 AND deleted_at IS NULL`,
    [normalizedEmail],
  );

  if (existing.rows[0]) {
    const user = existing.rows[0];
    if (googleId || avatarUrl) {
      await db.query(
        `UPDATE users
         SET google_id = COALESCE(google_id, $1),
             avatar_url = COALESCE($2, avatar_url),
             updated_at = NOW()
         WHERE id = $3`,
        [googleId ?? null, avatarUrl ?? null, user.id],
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: avatarUrl ?? user.avatar_url,
    };
  }

  const inserted = await db.query<AuthUser>(
    `INSERT INTO users (name, email, google_id, avatar_url)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, avatar_url`,
    [userName, normalizedEmail, googleId ?? null, avatarUrl ?? null],
  );

  return inserted.rows[0];
}

export async function findOrCreateFirebaseUser({
  uid,
  phoneNumber,
  email,
  name,
}: {
  uid: string;
  phoneNumber: string;
  email?: string;
  name?: string;
}): Promise<AuthUser> {
  const normalizedEmail = email?.trim().toLowerCase() || `phone-${uid}@phone.local`;
  const existing = await db.query<AuthUser>(
    `SELECT id, name, email, avatar_url
     FROM users
     WHERE deleted_at IS NULL
       AND (firebase_uid = $1 OR phone_number = $2 OR LOWER(email) = $3)
     LIMIT 1`,
    [uid, phoneNumber, normalizedEmail],
  );

  if (existing.rows[0]) {
    const user = existing.rows[0];
    await db.query(
      `UPDATE users
       SET firebase_uid = $1,
           phone_number = $2,
           email = CASE WHEN email LIKE 'phone-%@phone.local' THEN $3 ELSE email END,
           updated_at = NOW()
       WHERE id = $4`,
      [uid, phoneNumber, normalizedEmail, user.id],
    );
    return user;
  }

  const inserted = await db.query<AuthUser>(
    `INSERT INTO users (name, email, phone_number, firebase_uid)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, avatar_url`,
    [name?.trim() || phoneNumber, normalizedEmail, phoneNumber, uid],
  );
  return inserted.rows[0];
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await db.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt],
  );

  try {
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  } catch {
    // cookieStore may not be mutable in some route contexts; caller can also use buildSessionCookieHeader
  }

  return token;
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookieName)?.value;

    if (token) {
      await db.query("DELETE FROM sessions WHERE token_hash = $1", [
        hashToken(token),
      ]);
    }

    cookieStore.delete(sessionCookieName);
  } catch {
    // Ignore cookie store errors
  }
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
    `SELECT users.id, users.name, users.email, users.avatar_url
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
