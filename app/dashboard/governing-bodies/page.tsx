"use client"

import { useState, useEffect } from "react"
import type { User, GoverningBody } from "@/lib/types"
import { useApp } from "@/lib/context/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Users, Save, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Función auxiliar para formatear fechas
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "No especificada"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "No especificada"
    
    // Formatear como DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch (error) {
    return "No especificada"
  }
}

// Función para convertir fecha a formato YYYY-MM-DD para input date
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return ""
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    
    return date.toISOString().split('T')[0]
  } catch (error) {
    return ""
  }
}

export default function GoverningBodiesPage() {
  const { governingBodies, addGoverningBody, updateGoverningBody, deleteGoverningBody } = useApp()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEntity, setFilterEntity] = useState<string>("Todos")
  const [filterStatus, setFilterStatus] = useState<"Todos" | "Activo" | "Concluido">("Todos")
  
  // Estado local para manejar los integrantes y entes desde la API
  const [localGoverningBodies, setLocalGoverningBodies] = useState<GoverningBody[]>([])
  const [localEntities, setLocalEntities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isAddingBatch, setIsAddingBatch] = useState(false)
  const [batchMembers, setBatchMembers] = useState<Array<Omit<GoverningBody, "id">>>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    entityId: "",
    bodyType: "",
    memberName: "",
    position: "",
    appointmentDate: "",
    designationInstrument: "",
    status: "Activo" as "Activo" | "Concluido",
    observations: "",
  })

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedBody, setSelectedBody] = useState<GoverningBody | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<GoverningBody>>({})

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  // Cargar entes desde la API
  const loadEntities = async () => {
    try {
      const res = await fetch("/api/entes")
      const data = await res.json()
      setLocalEntities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading entities:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los entes",
        variant: "destructive",
      })
    }
  }

  // Cargar integrantes desde la API
  const loadGoverningBodies = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/integrantes-organo")
      const data = await res.json()
      setLocalGoverningBodies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading governing bodies:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los integrantes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar entes e integrantes al montar el componente
  useEffect(() => {
    loadEntities()
    loadGoverningBodies()
  }, [])

  // Usar localGoverningBodies y localEntities en lugar del contexto
  const filteredBodies = localGoverningBodies.filter((body) => {
    const entity = localEntities.find((e) => Number(e.id) === Number(body.entityId))
    const entityName = body.entityName || entity?.name
    const matchesSearch =
      body.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      body.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entityName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = filterEntity === "Todos" || Number(body.entityId) === Number(filterEntity)
    const matchesStatus = filterStatus === "Todos" || body.status === filterStatus
    return matchesSearch && matchesEntity && matchesStatus
  })

  const handleAddToBatch = () => {
    if (!formData.entityId || !formData.memberName || !formData.position) {
      toast({
        title: "Error",
        description: "Por favor complete los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (editingIndex !== null) {
      // Update existing member in batch
      const updated = [...batchMembers]
      updated[editingIndex] = formData
      setBatchMembers(updated)
      setEditingIndex(null)
      toast({
        title: "Actualizado",
        description: "Integrante actualizado en la lista",
      })
    } else {
      // Add new member to batch
      setBatchMembers([...batchMembers, formData])
      toast({
        title: "Agregado",
        description: "Integrante agregado a la lista",
      })
    }

    setFormData({
      entityId: formData.entityId, 
      bodyType: formData.bodyType, 
      memberName: "",
      position: "",
      appointmentDate: "",
      designationInstrument: "",
      status: "Activo",
      observations: "",
    })
  }

  const handleSaveBatch = async () => {
    if (batchMembers.length === 0) {
      toast({
        title: "Error",
        description: "Agregue al menos un integrante",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let successCount = 0
      for (const member of batchMembers) {
        const res = await fetch("/api/integrantes-organo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(member),
        })
        
        if (res.ok) {
          successCount++
        } else {
          const error = await res.json()
          console.error("Error al guardar:", error)
        }
      }

      if (successCount === batchMembers.length) {
        toast({
          title: "Registrados",
          description: `Se registraron ${successCount} integrantes correctamente`,
        })
        
        setIsAddingBatch(false)
        setBatchMembers([])
        setEditingIndex(null)
        setFormData({
          entityId: "",
          bodyType: "",
          memberName: "",
          position: "",
          appointmentDate: "",
          designationInstrument: "",
          status: "Activo",
          observations: "",
        })
        
        // Recargar los datos desde la API
        await loadGoverningBodies()
      } else {
        toast({
          title: "Parcialmente completado",
          description: `Se registraron ${successCount} de ${batchMembers.length} integrantes`,
          variant: "destructive",
        })
        // Recargar de todos modos para mostrar los que sí se guardaron
        await loadGoverningBodies()
      }
    } catch (error) {
      console.error("Error saving batch:", error)
      toast({
        title: "Error",
        description: "Error al guardar integrantes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditBatchMember = (index: number) => {
    setFormData(batchMembers[index])
    setEditingIndex(index)
  }

  const handleDeleteBatchMember = (index: number) => {
    setBatchMembers(batchMembers.filter((_, i) => i !== index))
    toast({
      title: "Eliminado",
      description: "Integrante eliminado de la lista",
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedBody) return

    try {
      const res = await fetch("/api/integrantes-organo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editFormData, id: selectedBody.id }),
      })

      if (res.ok) {
        toast({
          title: "Actualizado",
          description: "El integrante ha sido actualizado correctamente",
        })
        setEditDialogOpen(false)
        setSelectedBody(null)
        setEditFormData({})
        await loadGoverningBodies()
      }
    } catch (error) {
      console.error("Error updating:", error)
      toast({
        title: "Error",
        description: "Error al actualizar",
        variant: "destructive",
      })
    }
  }

  // Validación correcta de permisos
  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "CAPTURISTA"
  const isAdmin = currentUser?.role === "ADMIN"

  const openViewDialog = (id: number) => {
    const body = localGoverningBodies.find((b) => b.id === id)
    if (body) {
      setSelectedBody(body)
      setViewDialogOpen(true)
    }
  }

  const openEditDialog = (id: number) => {
    const body = localGoverningBodies.find((b) => b.id === id)
    if (body) {
      setSelectedBody(body)
      setEditFormData({ 
        ...body, 
        appointmentDate: formatDateForInput(body.appointmentDate)
      })
      setEditDialogOpen(true)
    }
  }

  const handleDelete = async (id: number) => {
    if (!isAdmin) {
      toast({
        title: "Sin permisos",
        description: "Solo los administradores pueden eliminar registros",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch(`/api/integrantes-organo/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error()

      toast({
        title: "Eliminado",
        description: "El registro ha sido eliminado",
      })

      await loadGoverningBodies()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Integrantes</h1>
          <p className="text-muted-foreground mt-2">Integrantes de juntas, consejos y comités</p>
        </div>
        {canEdit && !isAddingBatch && (
          <Button onClick={() => setIsAddingBatch(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Integrantes
          </Button>
        )}
      </div>

      {isAddingBatch && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Registro de Integrantes</CardTitle>
            <CardDescription>Complete el formulario y agregue múltiples integrantes antes de guardar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Formulario */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-accent/30">
              <h3 className="font-semibold text-lg">
                {editingIndex !== null ? "Editar Integrante" : "Nuevo Integrante"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entityId">Ente *</Label>
                  <Select
                    value={formData.entityId}
                    onValueChange={(value) => setFormData({ ...formData, entityId: value })}
                  >
                    <SelectTrigger className="min-w-[300px]">
                      <SelectValue placeholder="Seleccione un ente" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] min-w-[400px]">
                      {localEntities.map((entity) => (
                        <SelectItem key={entity.id} value={String(entity.id)} className="whitespace-normal">
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyType">Tipo de Órgano</Label>
                  <Input
                    id="bodyType"
                    value={formData.bodyType}
                    onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
                    placeholder="Junta, Consejo, Comité"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberName">Nombre del Integrante *</Label>
                  <Input
                    id="memberName"
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Presidente, Vocal, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Fecha de Nombramiento</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estatus</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Concluido">Concluido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="designationInstrument">Instrumento de Designación</Label>
                  <Input
                    id="designationInstrument"
                    value={formData.designationInstrument}
                    onChange={(e) => setFormData({ ...formData, designationInstrument: e.target.value })}
                    placeholder="Acuerdo, Oficio, etc."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddToBatch}>
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? "Actualizar en Lista" : "Agregar a Lista"}
                </Button>
              </div>
            </div>

            {/* Lista de integrantes a guardar */}
            {batchMembers.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Integrantes a Registrar ({batchMembers.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {batchMembers.map((member, index) => {
                    const entity = localEntities.find((e) => Number(e.id) === Number(member.entityId))
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 border border-border rounded-lg bg-background"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{member.memberName}</p>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                          <p className="text-xs text-muted-foreground">
                            {entity?.nombre_oficial} - {member.bodyType}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditBatchMember(index)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBatchMember(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingBatch(false)
                  setBatchMembers([])
                  setEditingIndex(null)
                  setFormData({
                    entityId: "",
                    bodyType: "",
                    memberName: "",
                    position: "",
                    appointmentDate: "",
                    designationInstrument: "",
                    status: "Activo",
                    observations: "",
                  })
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveBatch} disabled={batchMembers.length === 0 || isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Guardando..." : `Guardar Todos (${batchMembers.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Integrante</DialogTitle>
          </DialogHeader>
          {selectedBody && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ente</Label>
                  <p className="font-medium">{selectedBody.entityName || localEntities.find((e) => Number(e.id) === Number(selectedBody.entityId))?.name || "No especificado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Órgano</Label>
                  <p className="font-medium">{selectedBody.bodyType || "No especificado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedBody.memberName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cargo</Label>
                  <p className="font-medium">{selectedBody.position}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Nombramiento</Label>
                  <p className="font-medium">{formatDate(selectedBody.appointmentDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estatus</Label>
                  <p className="font-medium">
                    <Badge variant={selectedBody.status === "Activo" ? "default" : "outline"}>
                      {selectedBody.status}
                    </Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Instrumento de Designación</Label>
                  <p className="font-medium">{selectedBody.designationInstrument || "No especificado"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Observaciones</Label>
                  <p className="font-medium">{selectedBody.observations || "Sin observaciones"}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Integrante</DialogTitle>
          </DialogHeader>
          {selectedBody && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-entityId">Ente</Label>
                  <Select
                    value={String(editFormData.entityId)}
                    onValueChange={(value) => setEditFormData({ ...editFormData, entityId: Number(value) })}
                  >
                    <SelectTrigger className="min-w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] min-w-[400px]">
                      {localEntities.map((entity) => (
                        <SelectItem key={entity.id} value={String(entity.id)} className="whitespace-normal">
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bodyType">Tipo de Órgano</Label>
                  <Input
                    id="edit-bodyType"
                    value={editFormData.bodyType || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, bodyType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-memberName">Nombre del Integrante</Label>
                  <Input
                    id="edit-memberName"
                    value={editFormData.memberName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, memberName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Cargo</Label>
                  <Input
                    id="edit-position"
                    value={editFormData.position || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-appointmentDate">Fecha de Nombramiento</Label>
                  <Input
                    id="edit-appointmentDate"
                    type="date"
                    value={editFormData.appointmentDate || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, appointmentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estatus</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Concluido">Concluido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-designationInstrument">Instrumento de Designación</Label>
                  <Input
                    id="edit-designationInstrument"
                    value={editFormData.designationInstrument || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, designationInstrument: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-observations">Observaciones</Label>
                  <Textarea
                    id="edit-observations"
                    value={editFormData.observations || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, observations: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Integrantes Registrados</CardTitle>
              <CardDescription>
                {isLoading ? "Cargando..." : `${filteredBodies.length} integrantes en el sistema`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Todos los entes" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px] min-w-[350px]">
                  <SelectItem value="Todos">Todos los entes</SelectItem>
                  {localEntities.map((entity) => (
                    <SelectItem key={entity.id} value={String(entity.id)} className="whitespace-normal py-3">
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Activo">Activos</SelectItem>
                  <SelectItem value="Concluido">Concluidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBodies.map((body) => {
              // Usar entityName si viene de la API, sino buscar en localEntities
              const entityName = body.entityName || localEntities.find((e) => Number(e.id) === Number(body.entityId))?.name
              
              return (
                <div
                  key={body.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{body.memberName}</h3>
                        <p className="text-sm text-muted-foreground">{body.position}</p>
                      </div>
                      <Badge variant={body.status === "Activo" ? "default" : "outline"}>{body.status}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p>
                        <strong>Ente:</strong> {entityName || "No especificado"}
                      </p>
                      <p>
                        <strong>Órgano:</strong> {body.bodyType || "No especificado"}
                      </p>
                      <p>
                        <strong>Nombramiento:</strong> {formatDate(body.appointmentDate)}
                      </p>
                    </div>
                    
                    {/*  Botones con validación correcta */}
                    <div className="flex gap-1">
                      {/* Todos pueden ver */}
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(body.id)} title="Ver detalles">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Solo ADMIN y CAPTURISTA pueden editar */}
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(body.id)} title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* Solo ADMIN puede eliminar */}
                      {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(body.id)} title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredBodies.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron integrantes</p>
              </div>
            )}
            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Cargando integrantes...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}