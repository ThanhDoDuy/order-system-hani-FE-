import { getAccessToken, isTokenExpired, refreshAccessToken } from "@/lib/auth"

export interface HttpOptions extends RequestInit {
  requireAuth?: boolean
}

async function withAuthHeaders(init?: RequestInit): Promise<RequestInit> {
  let accessToken = getAccessToken()
  if (!accessToken || isTokenExpired()) {
    accessToken = await refreshAccessToken()
  }
  const headers = new Headers(init?.headers || {})
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }
  return { ...init, headers }
}

export async function httpFetch(input: string | URL | Request, options?: HttpOptions): Promise<Response> {
  const opts = options?.requireAuth ? await withAuthHeaders(options) : options
  let res = await fetch(input, opts)
  if (res.status === 401 && options?.requireAuth) {
    // Try refresh once, then retry the request
    const newAccess = await refreshAccessToken()
    if (!newAccess) return res
    const retryOpts = await withAuthHeaders(options)
    res = await fetch(input, retryOpts)
  }
  return res
}


