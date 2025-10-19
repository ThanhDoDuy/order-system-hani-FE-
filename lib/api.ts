export interface OrderItem {
  productId: string
  productName: string
  productPrice: number
  priceType: 'wholesale' | 'retail' // Loại giá được chọn
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  orderNumber: string
  status: "new" | "preparing" | "shipped" | "cancelled" | "rejected" | "draft"
  items: number
  customerName: string
  shippingService: "standard" | "priority" | "express"
  trackingCode: string
  createdAt: string
  total: number
  orderItems?: OrderItem[]
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  notes?: string
}

export interface Product {
  id: string
  name: string
  wholesalePrice?: number // Giá bán sỉ (optional for backward compatibility)
  retailPrice?: number // Giá bán lẻ (optional for backward compatibility)
  price?: number // Giá cũ (for backward compatibility)
  stock: number
  category: string
  status: "active" | "inactive"
  image?: string
  description?: string
  sku?: string
  weight?: number
  dimensions?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  description: string
  productCount: number
  createdAt: string
}

export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  totalProducts: number
  ordersTrend: number
  revenueTrend: number
}

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  role: "admin" | "user"
  status: "active" | "inactive"
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  description: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  // Get token from the auth system
  const { getAccessToken, isTokenExpired, refreshAccessToken } = await import('./auth')
  
  // Kiểm tra token có sắp hết hạn không (trước 5 phút)
  const token = getAccessToken()
  const isExpired = isTokenExpired()
  
  // Nếu token hết hạn hoặc sắp hết hạn, thử refresh
  if (isExpired || !token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
      }
    }
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Helper function to make authenticated requests with auto-retry
async function makeAuthenticatedRequest<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const { refreshAccessToken, clearSession } = await import('./auth')
  
  // Thử request lần đầu
  let response = await fetch(url, {
    ...options,
    headers: {
      ...await getAuthHeaders(),
      ...options.headers,
    }
  })
  
  // Nếu gặp 401, thử refresh token và retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      // Retry với token mới
      response = await fetch(url, {
        ...options,
        headers: {
          ...await getAuthHeaders(),
          ...options.headers,
        }
      })
    } else {
      // Refresh thất bại, clear session và redirect
      clearSession()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Authentication required')
    }
  }
  
  return handleApiResponse(response)
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      const { clearSession } = await import('./auth')
      clearSession()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Authentication required')
    }
    
    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new Error('Access denied')
    }
    
    // Handle network errors
    if (response.status === 0 || !response.status) {
      throw new Error('Network error: Unable to connect to server')
    }
    
    // Handle other errors
    const errorData = await response.json().catch(() => ({ 
      message: `HTTP ${response.status}: ${response.statusText}` 
    }))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }
  return response.json()
}

// Real API calls to backend
export const api = {
  // Orders
  async getOrders(
    page = 1,
    limit = 10,
    filters?: { status?: string; search?: string },
  ): Promise<{ data: Order[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && filters.status !== "all" && { status: filters.status }),
      ...(filters?.search && { search: filters.search }),
    })

    return makeAuthenticatedRequest(`${API_BASE_URL}/orders?${params}`)
  },

  async getOrder(id: string): Promise<Order | null> {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/orders/${id}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return null
      throw error
    }
  },

  async createOrder(data: Partial<Order>): Promise<Order> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteOrder(id: string): Promise<void> {
    await makeAuthenticatedRequest(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
    })
  },

  // Products
  async getProducts(
    page = 1,
    limit = 10,
    filters?: { category?: string; status?: string; search?: string },
  ): Promise<{ data: Product[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.category && filters.category !== "all" && { category: filters.category }),
      ...(filters?.status && filters.status !== "all" && { status: filters.status }),
      ...(filters?.search && { search: filters.search }),
    })

    return makeAuthenticatedRequest(`${API_BASE_URL}/products?${params}`)
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/products/${id}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return null
      throw error
    }
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteProduct(id: string): Promise<void> {
    await makeAuthenticatedRequest(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    })
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/categories`)
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteCategory(id: string): Promise<void> {
    await makeAuthenticatedRequest(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    })
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/dashboard/stats`)
  },

  // Users
  async getUsers(
    page = 1,
    limit = 10
  ): Promise<{ success: boolean; data: { users: User[]; total: number; page: number; limit: number } }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    return makeAuthenticatedRequest(`${API_BASE_URL}/users?${params}`)
  },

  async getUser(id: string): Promise<{ success: boolean; data: User }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users/${id}`)
  },

  async createUser(data: Partial<User>): Promise<{ success: boolean; data: User }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; data: User }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async updateUserStatus(id: string, status: 'active' | 'inactive'): Promise<{ success: boolean; data: User }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<{ success: boolean; data: User }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  },

  // Roles
  async getRoles(): Promise<{ success: boolean; data: Role[] }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/roles`)
  },

  async createRole(data: Partial<Role>): Promise<Role> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/roles`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteRole(id: string): Promise<void> {
    await makeAuthenticatedRequest(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
    })
  },

  // Permissions
  async getPermissions(): Promise<{ success: boolean; data: Permission[] }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/roles/permissions`)
  },

  async createPermission(data: Partial<Permission>): Promise<Permission> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/roles/permissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updatePermission(id: string, data: Partial<Permission>): Promise<Permission> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/roles/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deletePermission(id: string): Promise<void> {
    await makeAuthenticatedRequest(`${API_BASE_URL}/roles/permissions/${id}`, {
      method: 'DELETE',
    })
  },
}
