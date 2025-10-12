import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const configuredBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (!clientId || !clientSecret) {
    return new NextResponse("Missing Google OAuth envs", { status: 500 });
  }

  const origin = configuredBase || url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  // Validate state and retrieve code_verifier from cookies
  const cookieHeader = (request.headers.get("cookie") || "") as string;
  const cookieMap = new Map(cookieHeader.split(/;\s*/).map((c) => {
    const idx = c.indexOf("=")
    if (idx === -1) return [c, ""] as const
    return [c.substring(0, idx), decodeURIComponent(c.substring(idx + 1))] as const
  }))

  const savedState = cookieMap.get("oauth_state");
  const codeVerifier = cookieMap.get("oauth_code_verifier");

  if (!savedState || !codeVerifier || savedState !== state) {
    return new NextResponse("Invalid state or missing verifier", { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return new NextResponse(`Token exchange failed: ${text}`, { status: 400 });
    }

    const tokens = await tokenRes.json();

    // Prepare only token data (no userinfo). Include id_token for backend verification.
    const payload = {
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
        idToken: tokens.id_token || "",
      },
    }

    // Redirect to a client page to forward tokens to backend
    const redirect = NextResponse.redirect(`${origin}/login/success`)
    // Clear temporary cookies
    const isSecure = origin.startsWith("https://")
    redirect.cookies.set("oauth_state", "", { httpOnly: true, secure: isSecure, path: "/", maxAge: 0 })
    redirect.cookies.set("oauth_code_verifier", "", { httpOnly: true, secure: isSecure, path: "/", maxAge: 0 })
    // ✅ FIXED: set raw JSON (no encodeURIComponent)
    redirect.cookies.set("oauth_result", JSON.stringify(payload), {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60, // short-lived
    })
    return redirect;
  } catch (e: any) {
    return new NextResponse(`OAuth callback error: ${e?.message || "unknown"}`, { status: 500 })
  }
}


