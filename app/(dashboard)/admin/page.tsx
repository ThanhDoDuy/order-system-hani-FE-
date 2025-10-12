"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api, type Category } from "@/lib/api"
import { Plus, Edit, Trash2, Tag, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      console.log('🔄 Fetching categories from API...')
      const data = await api.getCategories()
      console.log('✅ Fetched categories:', data)
      console.log('📋 Categories data structure:', data.map(cat => ({ id: cat.id, name: cat.name, _id: (cat as any)._id })))
      setCategories(data)
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to fetch categories",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    }

    try {
      if (editingCategory) {
        console.log('Updating category:', editingCategory.id, data)
        if (!editingCategory.id) {
          throw new Error('Category ID is missing')
        }
        await api.updateCategory(editingCategory.id, data)
        toast({ title: "Category updated successfully" })
      } else {
        console.log('Creating new category:', data)
        await api.createCategory(data)
        toast({ title: "Category created successfully" })
      }

      setDialogOpen(false)
      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      try {
        console.log('Deleting category:', id)
        if (!id) {
          throw new Error('Category ID is missing')
        }
        await api.deleteCategory(id)
        toast({ title: "Category deleted successfully" })
        fetchCategories()
      } catch (error) {
        console.error('Failed to delete category:', error)
        toast({ 
          title: "Error", 
          description: error instanceof Error ? error.message : "Failed to delete category",
          variant: "destructive"
        })
      }
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">CATEGORIES</h1>
        <p className="text-muted-foreground mt-1">Manage product categories and types</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active product categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.reduce((sum, cat) => sum + cat.productCount, 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Products/Category</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.length > 0
                ? Math.round(categories.reduce((sum, cat) => sum + cat.productCount, 0) / categories.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average distribution</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Manage categories for organizing your products</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCategory(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <form onSubmit={handleSaveCategory}>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                    <DialogDescription>
                      {editingCategory
                        ? "Update category information"
                        : "Create a new category for organizing products"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Category Name</Label>
                      <Input id="name" name="name" defaultValue={editingCategory?.name} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingCategory?.description}
                        rows={3}
                        placeholder="Brief description of this category..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingCategory ? "Update" : "Create"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
              <Button variant="outline" onClick={fetchCategories}>
                🔄 Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CATEGORY NAME</TableHead>
                  <TableHead>DESCRIPTION</TableHead>
                  <TableHead>PRODUCTS</TableHead>
                  <TableHead>CREATED</TableHead>
                  <TableHead className="w-[100px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{category.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {category.productCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Editing category:', category)
                            console.log('Category ID:', category.id)
                            console.log('Category _id:', (category as any)._id)
                            
                            if (!category.id && !(category as any)._id) {
                              toast({
                                title: "Error",
                                description: "Category ID is missing",
                                variant: "destructive"
                              })
                              return
                            }
                            
                            // Use _id if id is not available
                            const categoryToEdit = {
                              ...category,
                              id: category.id || (category as any)._id
                            }
                            
                            setEditingCategory(categoryToEdit)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            const categoryId = category.id || (category as any)._id
                            if (!categoryId) {
                              toast({
                                title: "Error",
                                description: "Category ID is missing",
                                variant: "destructive"
                              })
                              return
                            }
                            handleDeleteCategory(categoryId)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
