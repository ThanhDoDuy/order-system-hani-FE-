export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: "admin" | "user"
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

// Mock user storage (in real app, this would be server-side session)
let currentUser: User | null = null
let currentTokens: { accessToken: string | null; expiryAt: number | null } = {
  accessToken: null,
  expiryAt: null,
}

export async function signInWithGoogle(): Promise<User> {
  if (typeof window === "undefined") throw new Error("Window not available")
  // Start real OAuth flow via route handler; page will redirect and not return here
  window.location.href = "/api/auth/google/start"
  // Return a pending promise that never resolves in practice due to redirect
  return new Promise(() => {}) as unknown as User
}

export async function signOut(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  currentUser = null
  currentTokens = { accessToken: null, expiryAt: null }
  localStorage.removeItem("user")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("tokenExpiry")

}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  // Check if user is authenticated first
  if (!isAuthenticated()) {
    return null
  }

  if (!currentUser) {
    const stored = localStorage.getItem("user")
    if (stored) {
      currentUser = JSON.parse(stored)
    }
  }

  return currentUser
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  
  // Return from memory first
  if (currentTokens.accessToken) {
    return currentTokens.accessToken
  }
  
  // Fallback to localStorage
  const storedToken = localStorage.getItem("accessToken")
  if (storedToken) {
    currentTokens.accessToken = storedToken
    return storedToken
  }
  
  return null
}

export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true

  const expiry = localStorage.getItem("tokenExpiry")
  if (!expiry) return true

  // Thêm buffer 5 phút trước khi token thực sự hết hạn
  const bufferTime = 5 * 60 * 1000 // 5 phút
  return Date.now() > (Number.parseInt(expiry) - bufferTime)
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  
  // Kiểm tra có access token không
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  // Nếu có refresh token, user vẫn được coi là authenticated
  // (có thể refresh access token)
  if (refreshToken) {
    return true
  }
  
  // Nếu không có refresh token, kiểm tra access token
  if (accessToken && !isTokenExpired()) {
    return true
  }
  
  // Không có token hợp lệ, clear session
  clearSession()
  return false
}

// New session/token helpers for BE-driven auth
export function setSessionTokens(params: { accessToken: string; refreshToken: string; expiresIn: number }): void {
  if (typeof window === "undefined") return
  const { accessToken, refreshToken, expiresIn } = params
  currentTokens.accessToken = accessToken
  const expiryAt = Date.now() + (expiresIn || 3600) * 1000
  currentTokens.expiryAt = expiryAt
  localStorage.setItem("accessToken", accessToken)
  localStorage.setItem("tokenExpiry", String(expiryAt))
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken)
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refreshToken")
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  currentTokens = { accessToken: null, expiryAt: null }
  currentUser = null
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("tokenExpiry")
  localStorage.removeItem("user")
}

export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  
  const res = await fetch(`${apiBase}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  })
  
  if (!res.ok) {
    clearSession()
    return null
  }
  
  const data = await res.json()
  const result = data?.data || data // Backend trả về { success: true, data: {...} }
  const newAccess = result?.accessToken as string | undefined
  const newRefresh = (result?.refreshToken as string | undefined) || refreshToken
  const expiresIn = (result?.expiresIn as number | undefined) || 3600
  
  if (!newAccess) return null
  
  setSessionTokens({ accessToken: newAccess, refreshToken: newRefresh, expiresIn })
  return newAccess
}
