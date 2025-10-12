import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("[FAKE BACKEND] Received Google tokens:", body)

    // Fake verify id_token (trong thực tế sẽ dùng Google API)
    const fakeUser = {
      email: "fakeuser@gmail.com",
      name: "Thanh Test",
      picture: "https://i.pravatar.cc/100?u=fake",
    }

    // Giả lập response từ backend thật
    const response = {
      accessToken: `fake_access_token_${Date.now()}`,
      refreshToken: `fake_refresh_token_${Math.random().toString(36).slice(2)}`,
      expiresIn: 3600,
      user: fakeUser,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (e: any) {
    console.error("[FAKE BACKEND] Error:", e)
    return new NextResponse("Failed to fake login", { status: 500 })
  }
}
