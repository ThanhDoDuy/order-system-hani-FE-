"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { setSessionTokens } from "@/lib/auth"

export default function LoginSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const doLogin = async () => {
      try {
        const cookie = document.cookie
          .split("; ")
          .find((c) => c.startsWith("oauth_result="))
        if (!cookie) {
          router.replace("/login?error=no_token")
          return
        }
  
        const value = decodeURIComponent(cookie.split("=")[1])
        const data = JSON.parse(value)
        if (!data?.tokens) {
          router.replace("/login?error=invalid_token")
          return
        }
  
        // Gửi token xuống BE
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'
        const endpoint = `${apiBase}/auth/google`
        
        console.log('🔗 Calling backend endpoint:', endpoint)
        console.log('📦 Sending tokens to backend...')

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            idToken: data.tokens.idToken,
          }),
        })
        
        console.log('📡 Backend response status:', res.status)
  
        if (!res.ok) {
          router.replace("/login?error=backend_fail")
          return
        }
  
        const body = await res.json().catch(() => null)
        console.log('📦 Backend response body:', body)
        
        if (body?.success && body?.data?.accessToken) {
          setSessionTokens({
            accessToken: body.data.accessToken,
            refreshToken: body.data.refreshToken || data.tokens.refreshToken,
            expiresIn: body.data.expiresIn ?? data.tokens.expiresIn ?? 3600,
          })
          console.log('✅ Authentication successful!')
        } else {
          console.error('❌ Invalid backend response:', body)
          router.replace("/login?error=invalid_response")
          return
        }
  
        // expire cookie sau khi dùng
        document.cookie = "oauth_result=; path=/; max-age=0; SameSite=Lax"
        router.replace("/dashboard")
      } catch (e) {
        console.error("Login success handler error:", e)
        router.replace("/login?error=unexpected")
      }
    }
  
    doLogin()
  }, [router])
  
  return null
}


