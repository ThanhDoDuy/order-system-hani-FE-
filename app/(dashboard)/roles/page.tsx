'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Role, Permission } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit, Trash2, Shield, Key } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false)
  const [isEditPermissionDialogOpen, setIsEditPermissionDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  })
  const [permissionFormData, setPermissionFormData] = useState({
    name: '',
    description: '',
    type: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesResponse, permissionsResponse] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
      ])
      
      console.log('Roles response:', rolesResponse)
      console.log('Permissions response:', permissionsResponse)
      
      // Handle backend response structure: { success: true, data: [...] }
      if (rolesResponse.success && rolesResponse.data) {
        setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : [])
      } else {
        setRoles(Array.isArray(rolesResponse) ? rolesResponse : [])
      }
      
      if (permissionsResponse.success && permissionsResponse.data) {
        setPermissions(Array.isArray(permissionsResponse.data) ? permissionsResponse.data : [])
      } else {
        setPermissions(Array.isArray(permissionsResponse) ? permissionsResponse : [])
      }
    } catch (error) {
      console.error('Load data error:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateRole = async () => {
    try {
      await api.createRole(roleFormData)
      toast({
        title: "Success",
        description: "Role created successfully",
      })
      setIsCreateRoleDialogOpen(false)
      setRoleFormData({ name: '', description: '', permissions: [] })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return
    
    try {
      await api.updateRole(editingRole.id, roleFormData)
      toast({
        title: "Success",
        description: "Role updated successfully",
      })
      setIsEditRoleDialogOpen(false)
      setEditingRole(null)
      setRoleFormData({ name: '', description: '', permissions: [] })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (role.name === 'admin' || role.name === 'user') {
      toast({
        title: "Error",
        description: "Cannot delete default roles",
        variant: "destructive",
      })
      return
    }

    try {
      await api.deleteRole(role.id)
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  const handleCreatePermission = async () => {
    try {
      await api.createPermission(permissionFormData)
      toast({
        title: "Success",
        description: "Permission created successfully",
      })
      setIsCreatePermissionDialogOpen(false)
      setPermissionFormData({ name: '', description: '', type: '' })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePermission = async () => {
    if (!editingPermission) return
    
    try {
      await api.updatePermission(editingPermission.id, permissionFormData)
      toast({
        title: "Success",
        description: "Permission updated successfully",
      })
      setIsEditPermissionDialogOpen(false)
      setEditingPermission(null)
      setPermissionFormData({ name: '', description: '', type: '' })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      })
    }
  }

  const handleDeletePermission = async (permission: Permission) => {
    try {
      await api.deletePermission(permission.id)
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive",
      })
    }
  }

  const openEditRoleDialog = (role: Role) => {
    setEditingRole(role)
    setRoleFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    })
    setIsEditRoleDialogOpen(true)
  }

  const openEditPermissionDialog = (permission: Permission) => {
    setEditingPermission(permission)
    setPermissionFormData({
      name: permission.name,
      description: permission.description,
      type: permission.type,
    })
    setIsEditPermissionDialogOpen(true)
  }

  const togglePermission = (permissionType: string) => {
    const newPermissions = roleFormData.permissions.includes(permissionType)
      ? roleFormData.permissions.filter(p => p !== permissionType)
      : [...roleFormData.permissions, permissionType]
    setRoleFormData({ ...roleFormData, permissions: newPermissions })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role & Permission Management</h1>
          <p className="text-muted-foreground">
            Manage roles and permissions for user access control
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>
                    Manage user roles and their permissions
                  </CardDescription>
                </div>
                <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>
                        Create a new role with specific permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role-name">Name</Label>
                        <Input
                          id="role-name"
                          value={roleFormData.name}
                          onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                          placeholder="Enter role name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role-description">Description</Label>
                        <Input
                          id="role-description"
                          value={roleFormData.description}
                          onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                          placeholder="Enter role description"
                        />
                      </div>
                      <div>
                        <Label>Permissions</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`permission-${permission.id}`}
                                checked={roleFormData.permissions.includes(permission.type)}
                                onCheckedChange={() => togglePermission(permission.type)}
                              />
                              <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRole}>Create Role</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading roles...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? 'default' : 'secondary'}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditRoleDialog(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {(role.name !== 'admin' && role.name !== 'user') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRole(role)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>
                    Manage system permissions
                  </CardDescription>
                </div>
                <Dialog open={isCreatePermissionDialogOpen} onOpenChange={setIsCreatePermissionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Permission</DialogTitle>
                      <DialogDescription>
                        Create a new system permission
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="permission-name">Name</Label>
                        <Input
                          id="permission-name"
                          value={permissionFormData.name}
                          onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })}
                          placeholder="Enter permission name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="permission-description">Description</Label>
                        <Input
                          id="permission-description"
                          value={permissionFormData.description}
                          onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })}
                          placeholder="Enter permission description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="permission-type">Type</Label>
                        <Input
                          id="permission-type"
                          value={permissionFormData.type}
                          onChange={(e) => setPermissionFormData({ ...permissionFormData, type: e.target.value })}
                          placeholder="Enter permission type (e.g., create_user)"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreatePermissionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePermission}>Create Permission</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading permissions...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4" />
                            <span className="font-medium">{permission.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.type}</Badge>
                        </TableCell>
                        <TableCell>{permission.description}</TableCell>
                        <TableCell>
                          <Badge variant={permission.isActive ? 'default' : 'secondary'}>
                            {permission.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditPermissionDialog(permission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePermission(permission)}
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
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">Name</Label>
              <Input
                id="edit-role-name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="edit-role-description">Description</Label>
              <Input
                id="edit-role-description"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                placeholder="Enter role description"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-permission-${permission.id}`}
                      checked={roleFormData.permissions.includes(permission.type)}
                      onCheckedChange={() => togglePermission(permission.type)}
                    />
                    <Label htmlFor={`edit-permission-${permission.id}`} className="text-sm">
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={isEditPermissionDialogOpen} onOpenChange={setIsEditPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update permission information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-permission-name">Name</Label>
              <Input
                id="edit-permission-name"
                value={permissionFormData.name}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })}
                placeholder="Enter permission name"
              />
            </div>
            <div>
              <Label htmlFor="edit-permission-description">Description</Label>
              <Input
                id="edit-permission-description"
                value={permissionFormData.description}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })}
                placeholder="Enter permission description"
              />
            </div>
            <div>
              <Label htmlFor="edit-permission-type">Type</Label>
              <Input
                id="edit-permission-type"
                value={permissionFormData.type}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, type: e.target.value })}
                placeholder="Enter permission type"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermission}>Update Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
