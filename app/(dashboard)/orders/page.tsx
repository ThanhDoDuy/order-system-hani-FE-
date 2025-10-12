"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Order, type Product } from "@/lib/api"
import { StatusBadge } from "@/components/status-badge"
import { ShippingBadge } from "@/components/shipping-badge"
import { Plus, Search, Edit, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ status: "all", search: "" })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    selectedProducts: [] as Array<{ productId: string; quantity: number; price: number }>,
    totalAmount: 0,
    status: "new" as "new" | "preparing" | "shipped" | "cancelled" | "rejected" | "draft",
    shippingAddress: "",
    shippingService: "standard" as "standard" | "priority" | "express",
    notes: ""
  })
  const limit = 10
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const { data, total } = await api.getOrders(page, limit, {
          status: filters.status !== "all" ? filters.status : undefined,
          search: filters.search || undefined,
        })
        setOrders(data)
        setTotal(total)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        // You can add toast notification here if needed
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [page, filters])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.getProducts(1, 100) // Get all products
        setProducts(data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      }
    }
    fetchProducts()
  }, [])

  // Calculate total amount when selected products change
  useEffect(() => {
    const total = newOrder.selectedProducts.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    setNewOrder(prev => ({ ...prev, totalAmount: total }))
  }, [newOrder.selectedProducts])

  const totalPages = Math.ceil(total / limit)

  const addProduct = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product || product.status !== 'active' || product.stock <= 0) {
      toast({
        title: "Error",
        description: "Product is not available or out of stock.",
        variant: "destructive",
      })
      return
    }

    const existingIndex = newOrder.selectedProducts.findIndex(item => item.productId === productId)
    
    if (existingIndex >= 0) {
      // Update existing product quantity
      const updatedProducts = [...newOrder.selectedProducts]
      const newTotalQuantity = updatedProducts[existingIndex].quantity + quantity
      
      // Check if total quantity exceeds stock
      if (newTotalQuantity > product.stock) {
        toast({
          title: "Error",
          description: `Only ${product.stock} items available in stock.`,
          variant: "destructive",
        })
        return
      }
      
      updatedProducts[existingIndex].quantity = newTotalQuantity
      setNewOrder(prev => ({ ...prev, selectedProducts: updatedProducts }))
    } else {
      // Add new product
      if (quantity > product.stock) {
        toast({
          title: "Error",
          description: `Only ${product.stock} items available in stock.`,
          variant: "destructive",
        })
        return
      }
      
      setNewOrder(prev => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, {
          productId,
          quantity,
          price: product.price
        }]
      }))
    }
  }

  const removeProduct = (productId: string) => {
    setNewOrder(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(item => item.productId !== productId)
    }))
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (product && quantity > product.stock) {
      toast({
        title: "Error",
        description: `Only ${product.stock} items available in stock.`,
        variant: "destructive",
      })
      return
    }

    setNewOrder(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    }))
  }

  const handleViewOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: "new" | "preparing" | "shipped" | "cancelled" | "rejected" | "draft") => {
    try {
      setIsUpdatingStatus(true)
      await api.updateOrder(orderId, { status: newStatus })
      
      // Update the selected order in modal
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
      
      // Update the order in the list
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      
      toast({
        title: "Success",
        description: "Order status updated successfully!",
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleCreateOrder = async () => {
    try {
      // Validate required fields
      if (!newOrder.customerName || !newOrder.customerEmail || newOrder.selectedProducts.length === 0) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Customer Name, Email, Products).",
          variant: "destructive",
        })
        return
      }

      // Create orderItems with product details
      const orderItems = newOrder.selectedProducts.map(item => {
        const product = products.find(p => p.id === item.productId)
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          productPrice: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        }
      })

      const orderData = {
        ...newOrder,
        items: newOrder.selectedProducts.reduce((sum, item) => sum + item.quantity, 0),
        total: newOrder.totalAmount,
        orderItems: orderItems
      }
      // Remove totalAmount and selectedProducts from the data sent to backend
      delete (orderData as any).totalAmount
      delete (orderData as any).selectedProducts
      await api.createOrder(orderData)
      toast({
        title: "Success",
        description: "Order created successfully!",
      })
      
      // Reset form and close modal
      setNewOrder({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        selectedProducts: [],
        totalAmount: 0,
        status: "new" as "new" | "preparing" | "shipped" | "cancelled" | "rejected" | "draft",
        shippingAddress: "",
        shippingService: "standard" as "standard" | "priority" | "express",
        notes: ""
      })
      setIsCreateModalOpen(false)
      
      // Refresh orders list
      const { data, total } = await api.getOrders(page, limit, {
        status: filters.status !== "all" ? filters.status : undefined,
        search: filters.search || undefined,
      })
      setOrders(data)
      setTotal(total)
    } catch (error) {
      console.error('Failed to create order:', error)
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order</h1>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create order
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-none w-[95vw] h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-16 py-4 px-8">
              {/* Left Side - Product Information */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="text-xl font-semibold">Product Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Add Products *</Label>
                    <Select onValueChange={(productId) => {
                      const product = products.find(p => p.id === productId)
                      if (product) {
                        addProduct(productId, 1)
                      }
                    }}>
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue placeholder="Choose a product to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(product => product.status === 'active' && product.stock > 0)
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.price.toLocaleString('vi-VN')}₫ (Stock: {product.stock})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Products List */}
                  {newOrder.selectedProducts.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Selected Products</Label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {newOrder.selectedProducts.map((item) => {
                          const product = products.find(p => p.id === item.productId)
                          if (!product) return null
                          
                          return (
                            <div key={item.productId} className="flex items-center gap-2 p-2 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.price.toLocaleString('vi-VN')}₫ each • Stock: {product.stock}
                              </div>
                            </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                                >
                                  +
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeProduct(item.productId)}
                                  className="text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="totalAmount" className="text-base font-medium">Total Amount (VND)</Label>
                    <Input
                      id="totalAmount"
                      type="text"
                      value={newOrder.totalAmount > 0 ? `${newOrder.totalAmount.toLocaleString('vi-VN')}₫` : ''}
                      readOnly
                      className="bg-muted font-semibold text-lg h-10"
                      placeholder="Auto calculated"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side - Customer Information */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="text-xl font-semibold">Customer Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="customerName" className="text-base font-medium">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                      placeholder="Enter customer name"
                      className="h-10 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="customerEmail" className="text-base font-medium">Customer Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={newOrder.customerEmail}
                      onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                      placeholder="Enter customer email"
                      className="h-10 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="customerPhone" className="text-base font-medium">Customer Phone</Label>
                    <Input
                      id="customerPhone"
                      value={newOrder.customerPhone}
                      onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                      placeholder="Enter customer phone"
                      className="h-10 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="shippingAddress" className="text-base font-medium">Shipping Address</Label>
                    <Textarea
                      id="shippingAddress"
                      value={newOrder.shippingAddress}
                      onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
                      placeholder="Enter shipping address"
                      rows={2}
                      className="text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="status" className="text-base font-medium">Status</Label>
                      <Select value={newOrder.status} onValueChange={(value: "new" | "preparing" | "shipped" | "cancelled" | "rejected" | "draft") => setNewOrder({ ...newOrder, status: value })}>
                        <SelectTrigger className="h-10 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="shippingService" className="text-base font-medium">Shipping Service</Label>
                      <Select value={newOrder.shippingService} onValueChange={(value: "standard" | "priority" | "express") => setNewOrder({ ...newOrder, shippingService: value })}>
                        <SelectTrigger className="h-10 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="express">Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-base font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                      placeholder="Enter any additional notes"
                      rows={1}
                      className="text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" size="lg" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button size="lg" onClick={handleCreateOrder}>
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="!max-w-none w-[95vw] h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="grid grid-cols-2 gap-16 py-4 px-8">
                {/* Left Side - Order & Customer Information */}
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold mb-4">Order Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Order ID</Label>
                        <p className="text-lg">{selectedOrder.id}</p>
                      </div>
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Order Number</Label>
                        <p className="text-lg">{selectedOrder.orderNumber}</p>
                      </div>
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Status</Label>
                        <div className="mt-2">
                          <StatusBadge status={selectedOrder.status} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Total Amount</Label>
                        <p className="text-xl font-bold text-green-600">{selectedOrder.total.toLocaleString('vi-VN')}₫</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold mb-4">Customer Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Name</Label>
                        <p className="text-lg">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Email</Label>
                        <p className="text-lg">{selectedOrder.customerEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Phone</Label>
                        <p className="text-lg">{selectedOrder.customerPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Shipping Service</Label>
                        <div className="mt-2">
                          <ShippingBadge service={selectedOrder.shippingService} />
                        </div>
                      </div>
                      {selectedOrder.shippingAddress && (
                        <div>
                          <Label className="text-base font-medium text-muted-foreground">Shipping Address</Label>
                          <div className="text-lg whitespace-pre-wrap bg-gray-50 p-3 rounded-lg leading-relaxed border">
                            {selectedOrder.shippingAddress}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Tracking Code</Label>
                        <div className="text-lg font-mono bg-gray-50 p-3 rounded-lg break-all border">
                          {selectedOrder.trackingCode}
                        </div>
                      </div>
                      <div>
                        <Label className="text-base font-medium text-muted-foreground">Created At</Label>
                        <p className="text-lg">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>
                      {selectedOrder.notes && (
                        <div>
                          <Label className="text-base font-medium text-muted-foreground">Notes</Label>
                          <div className="text-lg whitespace-pre-wrap bg-gray-50 p-3 rounded-lg leading-relaxed border">
                            {selectedOrder.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Order Items */}
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold mb-4">Order Items</h3>
                    {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedOrder.orderItems.map((item, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="text-lg font-semibold">{item.productName}</p>
                                <p className="text-sm text-muted-foreground">ID: {item.productId}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                                <p className="text-lg font-semibold">{item.quantity}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Price Each</Label>
                                <p className="text-lg">{item.productPrice.toLocaleString('vi-VN')}₫</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between items-center">
                                <Label className="text-base font-medium">Subtotal</Label>
                                <p className="text-xl font-bold text-green-600">{item.subtotal.toLocaleString('vi-VN')}₫</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-lg text-muted-foreground">No items found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex gap-4">
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Order ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ORDER ID</TableHead>
                  <TableHead>ORDER NUMBER</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ITEM</TableHead>
                  <TableHead>CUSTOMER NAME</TableHead>
                  <TableHead>SHIPPING SERVICE</TableHead>
                  <TableHead>TRACKING CODE</TableHead>
                  <TableHead className="w-[100px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={order.id || (order as any)._id || `order-${index}`}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <ShippingBadge service={order.shippingService} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{order.trackingCode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewOrderDetail(order)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleUpdateStatus(order.id, value as "new" | "preparing" | "shipped" | "cancelled" | "rejected" | "draft")}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {totalPages > 5 && <span className="px-2">...</span>}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
