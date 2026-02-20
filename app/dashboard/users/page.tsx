"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import type { User, UserRole } from "@/lib/types"
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

// Importar las funciones de SweetAlert2
import { 
  confirmDelete, 
  showSuccess, 
  showError, 
  showLoading, 
  closeLoading,
  confirmUpdate
} from '@/lib/swalUtils'

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useApp()
  const { toast } = useToast()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
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
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)

      // Only administrators can access this page
      if (user.role !== "ADMIN") {
        toast({
          title: "Acceso Denegado",
          description: "Solo los administradores pueden gestionar usuarios",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    }
  }, [router, toast])

  // Safety check for undefined users array
  const safeUsers = users || []

  const filteredUsers = safeUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "Todos" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "CAPTURISTA",
    })
    setShowPassword(false)
  }

  // Función handleAdd con SweetAlert2
  const handleAdd = async () => {
    // Validación
    if (!formData.name || !formData.email || !formData.password) {
      showError("Campos requeridos", "Por favor complete todos los campos")
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError("Email inválido", "Por favor ingrese un correo electrónico válido")
      return
    }

    // Check if email already exists
    if (safeUsers.some((u) => u.email === formData.email)) {
      showError("Email duplicado", "El correo electrónico ya está registrado")
      return
    }

    // Mostrar loading
    showLoading("Creando usuario...", "Por favor espere")
    setIsLoading(true)

    try {
      await addUser(formData)

      closeLoading()

      // Cerrar modal y limpiar ANTES de mostrar alerta
      setIsAddDialogOpen(false)
      resetForm()

      await showSuccess("¡Usuario registrado!", `${formData.name} ha sido creado correctamente`)
    } catch (error) {
      closeLoading()
      console.error("Error adding user:", error)
      showError("Error al crear usuario", "No se pudo crear el usuario. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función handleEdit con SweetAlert2
  const handleEdit = async () => {
    if (selectedUser === null) return

    // Validación
    if (!formData.name || !formData.email) {
      showError("Campos requeridos", "Por favor complete los campos obligatorios")
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError("Email inválido", "Por favor ingrese un correo electrónico válido")
      return
    }

    // Guardar datos temporalmente antes de cerrar el modal
    const tempFormData = { ...formData }
    const tempSelectedUser = selectedUser
    const userName = formData.name

    // Cerrar el modal ANTES de mostrar la confirmación
    setIsEditDialogOpen(false)
    
    // Pequeño delay para que el modal se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 100))

    // Pedir confirmación
    const result = await confirmUpdate(`el usuario "${userName}"`)
    
    if (!result.isConfirmed) {
      // Usuario canceló, volver a abrir el modal
      setIsEditDialogOpen(true)
      return
    }

    // Usuario confirmó, continuar con el guardado
    showLoading("Actualizando usuario...", "Por favor espere")
    setIsLoading(true)

    try {
      await updateUser(tempSelectedUser, tempFormData)

      closeLoading()

      // Limpiar estados
      setSelectedUser(null)
      resetForm()

      await showSuccess("¡Actualizado!", "Los cambios se guardaron correctamente")
    } catch (error) {
      closeLoading()
      console.error("Error updating user:", error)
      showError("Error al actualizar", "No se pudieron guardar los cambios. Intente nuevamente.")
      // Volver a abrir el modal si hay error
      setIsEditDialogOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Función handleDelete con SweetAlert2
  const handleDelete = async (id: number) => {
    const userToDelete = safeUsers.find((u) => u.id === id)

    // Prevent deleting yourself
    if (currentUser?.id === id) {
      showError("Operación no permitida", "No puedes eliminar tu propia cuenta")
      return
    }

    if (!userToDelete) return

    // Pedir confirmación
    const result = await confirmDelete(`el usuario "${userToDelete.name}"`)
    
    if (result.isConfirmed) {
      // Mostrar loading
      showLoading("Eliminando usuario...", "Por favor espere")
      setIsLoading(true)

      try {
        await deleteUser(id)

        closeLoading()

        await showSuccess("¡Eliminado!", `${userToDelete.name} ha sido eliminado correctamente`)
      } catch (error) {
        closeLoading()
        console.error("Error deleting user:", error)
        showError("Error al eliminar", "No se pudo eliminar el usuario. Intente nuevamente.")
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
      setShowPassword(false)
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
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetForm()
        }}>
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
                   autoComplete="new-password"                  />
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
                 autoComplete="off"
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setSelectedUser(null)
          resetForm()
        }
      }}>
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
                autoComplete="new-password"             
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