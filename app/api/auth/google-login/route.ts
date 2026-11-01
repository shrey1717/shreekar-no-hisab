import { connection } from "next/server";
import { createSession, findOrCreateGoogleUser } from "@/src/lib/auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";

interface GoogleIdTokenPayload {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  email_verified?: boolean | string;
}

function parseJwt(token: string): GoogleIdTokenPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload) as GoogleIdTokenPayload;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  await connection();
  try {
    const body = await request.json().catch(() => ({}));
    const { credential, email, name, avatarUrl, googleId } = body;

    let userEmail = "";
    let userName = "";
    let userAvatar = avatarUrl || "";
    let userGoogleId = googleId || "";

    if (credential) {
      // 1. Try decoding Google JWT
      const decoded = parseJwt(credential);
      if (decoded?.email) {
        userEmail = decoded.email;
        userName = decoded.name || decoded.email.split("@")[0];
        userAvatar = decoded.picture || "";
        userGoogleId = decoded.sub || "";
      } else {
        // Fallback: verify with Google's public tokeninfo endpoint
        try {
          const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.email) {
              userEmail = data.email;
              userName = data.name || data.email.split("@")[0];
              userAvatar = data.picture || "";
              userGoogleId = data.sub || "";
            }
          }
        } catch {
          // Ignore network failure in isolated sandboxes
        }
      }
    } else if (email) {
      // Direct Google user profile payload
      userEmail = String(email).trim().toLowerCase();
      userName = String(name || userEmail.split("@")[0]).trim();
    }

    if (!userEmail || !userEmail.includes("@")) {
      throw new ApiError("INVALID_REQUEST", "Please provide a valid Google account.", 400);
    }

    const user = await findOrCreateGoogleUser({
      email: userEmail,
      name: userName || userEmail.split("@")[0],
      googleId: userGoogleId || undefined,
      avatarUrl: userAvatar || undefined,
    });

    await createSession(user.id);

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
