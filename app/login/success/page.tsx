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
        
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            idToken: data.tokens.idToken,
          }),
        })
        
        if (!res.ok) {
          router.replace("/login?error=backend_fail")
          return
        }
  
        const body = await res.json().catch(() => null)
        
        if (body?.success && body?.data?.accessToken) {
          setSessionTokens({
            accessToken: body.data.accessToken,
            refreshToken: body.data.refreshToken || data.tokens.refreshToken,
            expiresIn: body.data.expiresIn ?? data.tokens.expiresIn ?? 3600,
          })
          
          // Save user data to localStorage
          if (body.data.user) {
            localStorage.setItem("user", JSON.stringify(body.data.user))
          }

        } else {
          console.error('❌ Invalid backend response:', body)
          router.replace("/login?error=invalid_response")
          return
        }
  
        // expire cookie sau khi dùng
        document.cookie = "oauth_result=; path=/; max-age=0; SameSite=Lax"
        
        // Small delay to ensure localStorage is saved
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('🚀 Redirecting to dashboard...')
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


