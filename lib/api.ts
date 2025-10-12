export interface OrderItem {
  productId: string
  productName: string
  productPrice: number
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
  price: number
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

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  // Get token from the auth system
  const { getAccessToken } = await import('./auth')
  const token = getAccessToken()
  
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      const { clearSession } = await import('./auth')
      clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }
    
    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new Error('Access denied')
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

    const response = await fetch(`${API_BASE_URL}/orders?${params}`, {
      headers: await getAuthHeaders(),
    })

    return handleApiResponse(response)
  },

  async getOrder(id: string): Promise<Order | null> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: await getAuthHeaders(),
    })

    if (response.status === 404) return null
    return handleApiResponse(response)
  },

  async createOrder(data: Partial<Order>): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return handleApiResponse(response)
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return handleApiResponse(response)
  },

  async deleteOrder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete order: ${response.statusText}`)
    }
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

    const response = await fetch(`${API_BASE_URL}/products?${params}`, {
      headers: await getAuthHeaders(),
    })

    return handleApiResponse(response)
  },

  async getProduct(id: string): Promise<Product | null> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: await getAuthHeaders(),
    })

    if (response.status === 404) return null
    return handleApiResponse(response)
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return handleApiResponse(response)
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return handleApiResponse(response)
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`)
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: await getAuthHeaders(),
    })

    return handleApiResponse(response)
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return handleApiResponse(response)
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return handleApiResponse(response)
  },

  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete category: ${response.statusText}`)
    }
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: await getAuthHeaders(),
    })

    return handleApiResponse(response)
  },
}
