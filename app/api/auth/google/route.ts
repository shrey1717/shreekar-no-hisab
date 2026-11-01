import { connection } from "next/server";

export async function GET(request: Request) {
  await connection();
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  if (!clientId) {
    // If Google Client ID not yet configured in env, redirect back with hint
    return Response.redirect(`${url.origin}/?error=google_not_configured`);
  }

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return Response.redirect(googleAuthUrl.toString());
}
