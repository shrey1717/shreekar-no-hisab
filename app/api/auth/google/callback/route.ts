import { connection } from "next/server";
import { buildSessionCookieHeader, createSession, findOrCreateGoogleUser } from "@/src/lib/auth";

type GoogleTokenResponse = {
  access_token?: string;
};

type GoogleProfile = {
  email?: string;
  name?: string;
  sub?: string;
  picture?: string;
};

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");
  const origin = url.origin;

  if (providerError) {
    return Response.redirect(`${origin}/?error=google_${encodeURIComponent(providerError)}`);
  }

  if (!code) {
    return Response.redirect(`${origin}/?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return Response.redirect(`${origin}/?error=google_credentials_missing`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenPayload = (await tokenRes.json()) as GoogleTokenResponse & {
      error?: string;
      error_description?: string;
    };
    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", tokenPayload.error);
      return Response.redirect(
        `${origin}/?error=google_token_${encodeURIComponent(tokenPayload.error || "failed")}`,
      );
    }

    const tokenData = tokenPayload;
    if (!tokenData.access_token) {
      return Response.redirect(`${origin}/?error=missing_access_token`);
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userInfoRes.ok) {
      console.error("Google userinfo request failed:", userInfoRes.status);
      return Response.redirect(`${origin}/?error=userinfo_failed`);
    }

    const profile = (await userInfoRes.json()) as GoogleProfile;
    if (!profile.email || !profile.sub) {
      return Response.redirect(`${origin}/?error=invalid_google_profile`);
    }

    const user = await findOrCreateGoogleUser({
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      googleId: profile.sub,
      avatarUrl: profile.picture,
    });
    const sessionToken = await createSession(user.id);
    const response = Response.redirect(`${origin}/`);
    response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken));
    return response;
  } catch (error) {
    console.error("Google OAuth error:", error);
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    const callbackError =
      errorCode === "ECONNREFUSED" ||
      errorCode === "ENOTFOUND" ||
      errorCode === "ETIMEDOUT"
        ? "database_unavailable"
        : "oauth_server_error";
    return Response.redirect(`${origin}/?error=${callbackError}`);
  }
}
