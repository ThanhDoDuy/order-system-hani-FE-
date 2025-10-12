import { NextResponse } from "next/server"

// Generates a cryptographically secure random string
function generateRandomString(length: number): string {
  const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  let randomString = ""
  array.forEach((v) => (randomString += validChars[v % validChars.length]))
  return randomString
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return await crypto.subtle.digest("SHA-256", data)
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return Buffer.from(binary, "binary").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const configuredBase = process.env.NEXT_PUBLIC_BASE_URL
  if (!clientId) {
    return new NextResponse("Missing GOOGLE_CLIENT_ID", { status: 500 })
  }

  const origin = configuredBase || new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/google/callback`

  const codeVerifier = generateRandomString(64)
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier))
  const state = generateRandomString(32)

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  const res = NextResponse.redirect(authUrl)
  // Store verifier and state in httpOnly cookies for callback validation
  const isSecure = origin.startsWith("https://")
  res.cookies.set("oauth_code_verifier", codeVerifier, { httpOnly: true, secure: isSecure, path: "/", sameSite: "lax", maxAge: 60 * 10 })
  res.cookies.set("oauth_state", state, { httpOnly: true, secure: isSecure, path: "/", sameSite: "lax", maxAge: 60 * 10 })
  return res
}


