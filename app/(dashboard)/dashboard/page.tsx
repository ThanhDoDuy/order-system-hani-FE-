"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api, type DashboardStats, type Order } from "@/lib/api"
import { ArrowUpRight, ArrowDownRight, ShoppingCart, DollarSign, Package, Clock } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          api.getDashboardStats(),
          api.getOrders(1, 5) // Get recent 5 orders
        ])
        setStats(statsData)
        setRecentOrders(ordersData.data || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // You can add toast notification here if needed
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders.toLocaleString(),
      trend: stats?.ordersTrend,
      icon: ShoppingCart,
      color: "text-chart-1",
    },
    {
      title: "Total Revenue",
      value: `${stats?.totalRevenue.toLocaleString('vi-VN')}₫`,
      trend: stats?.revenueTrend,
      icon: DollarSign,
      color: "text-chart-2",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders.toLocaleString(),
      icon: Clock,
      color: "text-chart-3",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts.toLocaleString(),
      icon: Package,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend !== undefined && (
                <div className="flex items-center text-xs mt-1">
                  {stat.trend > 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-success mr-1" />
                      <span className="text-success font-medium">+{stat.trend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                      <span className="text-destructive font-medium">{stat.trend}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer" onClick={() => router.push('/orders')}>
                    <div className={`h-2 w-2 rounded-full ${
                      order.status === 'new' ? 'bg-info' :
                      order.status === 'preparing' ? 'bg-warning' :
                      order.status === 'shipped' ? 'bg-success' :
                      order.status === 'cancelled' || order.status === 'rejected' ? 'bg-destructive' :
                      'bg-muted'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order #{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customerName} • {order.total.toLocaleString('vi-VN')}₫ • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'new' ? 'bg-info/10 text-info' :
                      order.status === 'preparing' ? 'bg-warning/10 text-warning' :
                      order.status === 'shipped' ? 'bg-success/10 text-success' :
                      order.status === 'cancelled' || order.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                onClick={() => router.push('/orders')}
              >
                <ShoppingCart className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm font-medium">New Order</span>
              </button>
              <button 
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                onClick={() => router.push('/products')}
              >
                <Package className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm font-medium">Add Product</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
