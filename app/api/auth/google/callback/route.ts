import { connection } from "next/server";
import { createSession, findOrCreateGoogleUser } from "@/src/lib/auth";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return Response.redirect(`${origin}/?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
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

    if (!tokenRes.ok) {
      return Response.redirect(`${origin}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return Response.redirect(`${origin}/?error=userinfo_failed`);
    }

    const profile = await userInfoRes.json();
    const user = await findOrCreateGoogleUser({
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      googleId: profile.sub,
      avatarUrl: profile.picture,
    });

    await createSession(user.id);
    return Response.redirect(`${origin}/`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return Response.redirect(`${origin}/?error=oauth_error`);
  }
}
