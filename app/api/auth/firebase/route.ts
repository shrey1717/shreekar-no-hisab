import { buildSessionCookieHeader, createSession, findOrCreateFirebaseUser } from "@/src/lib/auth";
import { ApiError, errorResponse } from "@/src/lib/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const idToken = typeof body.idToken === "string" ? body.idToken : "";
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!idToken || !apiKey) {
      throw new ApiError("INVALID_FIREBASE_LOGIN", "Phone verification is not configured.", 400);
    }

    const verification = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    const payload = (await verification.json()) as {
      users?: Array<{
        localId?: string;
        phoneNumber?: string;
        email?: string;
        displayName?: string;
      }>;
    };
    const firebaseUser = payload.users?.[0];

    if (!verification.ok || !firebaseUser?.localId || !firebaseUser.phoneNumber) {
      throw new ApiError("INVALID_PHONE_VERIFICATION", "Phone verification failed.", 401);
    }

    const user = await findOrCreateFirebaseUser({
      uid: firebaseUser.localId,
      phoneNumber: firebaseUser.phoneNumber,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
    });
    const sessionToken = await createSession(user.id);
    const response = Response.json({ user });
    response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken));
    return response;
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
