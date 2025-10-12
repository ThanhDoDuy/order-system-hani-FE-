import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const refreshToken = body?.refreshToken as string | undefined
  if (!refreshToken) {
    return new NextResponse("Missing refreshToken", { status: 400 })
  }
  const now = Date.now()
  const tail = refreshToken.slice(-6)
  return NextResponse.json({
    accessToken: `fake_access_${now}_${tail}`,
    expiresIn: 3600,
    tokenType: "Bearer",
    // optionally rotate refresh token
    refreshToken,
  })
}


