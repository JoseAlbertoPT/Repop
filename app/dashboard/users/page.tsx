"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import type { User, UserRole } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"  
import { useApp } from "@/lib/context/app-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, UserCog, Shield, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useApp()
  const { toast } = useToast()
  const router = useRouter()
  const { currentUser } = useAuth()  
  // const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("Todos")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CAPTURISTA" as UserRole,
  })

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      toast({
        title: "Acceso Denegado",
        description: "Solo los administradores pueden gestionar usuarios",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [currentUser, router, toast])

  const safeUsers = users || []

  const filteredUsers = safeUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "Todos" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    if (safeUsers.some((u) => u.email === formData.email)) {
      toast({
        title: "Error",
        description: "El correo electrónico ya está registrado",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await addUser(formData)
      toast({
        title: "Usuario registrado",
        description: 'El usuario ${formData.name} ha sido creado correctamente ',
      })
      setIsAddDialogOpen(false)
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "CAPTURISTA",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el usuario. Por favor intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (selectedUser === null) return

    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await updateUser(selectedUser, formData)
      toast({
        title: "Actualizado",
        description: "El usuario ha sido actualizado correctamente",
      })
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "CAPTURISTA",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario. Por favor intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    const userToDelete = safeUsers.find((u) => u.id === id)

    if (currentUser?.id === id) {
      toast({
        title: "Error",
        description: "No puedes eliminar tu propia cuenta",
        variant: "destructive",
      })
      return
    }

    if (confirm('¿Está seguro de eliminar al usuario ${userToDelete?.name}?')){
      setIsLoading(true)
      try {
        await deleteUser(id)
        toast({
          title: "Eliminado",
          description: "El usuario ha sido eliminado",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario. Por favor intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const openEditDialog = (id: number) => {
    const user = safeUsers.find((u) => u.id === id)
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
      })
      setSelectedUser(id)
      setIsEditDialogOpen(true)
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "default"
      case "CAPTURISTA":
        return "secondary"
      case "CONSULTA":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="w-4 h-4" />
      case "CAPTURISTA":
        return <Edit className="w-4 h-4" />
      case "CONSULTA":
        return <Eye className="w-4 h-4" />
      default:
        return <UserCog className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "Administrador"
      case "CAPTURISTA":
        return "Capturista"
      case "CONSULTA":
        return "Consulta"
      default:
        return role
    }
  }

  if (currentUser?.role !== "ADMIN") {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-2">Administración de cuentas y permisos del sistema</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Usuario</DialogTitle>
              <DialogDescription>Complete la información del nuevo usuario del sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del usuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@morelos.gob.mx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Contraseña de acceso"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol del Usuario *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                    <SelectItem value="CAPTURISTA">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Capturista
                      </div>
                    </SelectItem>
                    <SelectItem value="CONSULTA">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Consulta
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Administrador:</strong> Acceso completo, gestión de usuarios
                  <br />
                  <strong>Capturista:</strong> Registrar y consultar información
                  <br />
                  <strong>Consulta:</strong> Solo consultar información
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeUsers.filter((u) => u.role === "ADMIN").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Con acceso completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capturistas</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeUsers.filter((u) => u.role === "CAPTURISTA").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pueden registrar datos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>{filteredUsers.length} usuarios</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="CAPTURISTA">Capturista</SelectItem>
                  <SelectItem value="CONSULTA">Consulta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors",
                  currentUser?.id === user.id && "bg-accent/30",
                )}
              >
                <div
                  className={`p-3 rounded-lg ${
                    user.role === "ADMIN"
                      ? "bg-primary/10 text-primary"
                      : user.role === "CAPTURISTA"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {getRoleIcon(user.role)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        {currentUser?.id === user.id && (
                          <Badge variant="outline" className="text-xs">
                            Tú
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(user.id)}
                      disabled={isLoading}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    {currentUser?.id !== user.id && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(user.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron usuarios</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nueva Contraseña (dejar en blanco para no cambiar)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nueva contraseña (opcional)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol del Usuario</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="CAPTURISTA">
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Capturista
                    </div>
                  </SelectItem>
                  <SelectItem value="CONSULTA">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Consulta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}