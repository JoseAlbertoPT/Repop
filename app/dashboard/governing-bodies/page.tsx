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
import { Plus, Search, Edit, Trash2, Users, Save, Eye, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { 
  confirmDelete, 
  showSuccess, 
  showError, 
  showLoading, 
  closeLoading,
  confirmUpdate
} from '@/lib/swalUtils'

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "No especificada"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "No especificada"
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    return "No especificada"
  }
}

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
  
  const [localGoverningBodies, setLocalGoverningBodies] = useState<GoverningBody[]>([])
  const [localEntities, setLocalEntities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Modal de agregar (reemplaza el Card inline)
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
    if (userStr) setCurrentUser(JSON.parse(userStr))
  }, [])

  const loadEntities = async () => {
    try {
      const res = await fetch("/api/entes")
      const data = await res.json()
      setLocalEntities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading entities:", error)
      toast({ title: "Error", description: "No se pudieron cargar los entes", variant: "destructive" })
    }
  }

  const loadGoverningBodies = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/integrantes-organo")
      const data = await res.json()
      setLocalGoverningBodies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading governing bodies:", error)
      toast({ title: "Error", description: "No se pudieron cargar los integrantes", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEntities()
    loadGoverningBodies()
  }, [])

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
      showError("Campos requeridos", "Por favor complete: Ente, Nombre del Integrante y Cargo")
      return
    }

    if (editingIndex !== null) {
      const updated = [...batchMembers]
      updated[editingIndex] = formData
      setBatchMembers(updated)
      setEditingIndex(null)
      toast({ title: "Actualizado", description: "Integrante actualizado en la lista" })
    } else {
      setBatchMembers([...batchMembers, formData])
      toast({ title: "Agregado", description: "Integrante agregado a la lista" })
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
      showError("Lista vacía", "Agregue al menos un integrante a la lista antes de guardar")
      return
    }

    showLoading("Guardando integrantes...", "Por favor espere")
    setIsLoading(true)

    try {
      let successCount = 0
      let errorCount = 0

      for (const member of batchMembers) {
        const res = await fetch("/api/integrantes-organo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(member),
        })
        if (res.ok) successCount++
        else {
          errorCount++
          const error = await res.json()
          console.error("Error al guardar:", error)
        }
      }

      closeLoading()

      if (successCount === batchMembers.length) {
        setIsAddingBatch(false)
        setBatchMembers([])
        setEditingIndex(null)
        setFormData({ entityId: "", bodyType: "", memberName: "", position: "", appointmentDate: "", designationInstrument: "", status: "Activo", observations: "" })
        await showSuccess("¡Integrantes registrados!", `Se registraron ${successCount} integrantes correctamente`)
        await loadGoverningBodies()
      } else if (successCount > 0) {
        await showError("Guardado parcial", `Se registraron ${successCount} de ${batchMembers.length} integrantes`)
        await loadGoverningBodies()
      } else {
        showError("Error al guardar", "No se pudo guardar ningún integrante. Intente nuevamente.")
      }
    } catch (error) {
      closeLoading()
      console.error("Error saving batch:", error)
      showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
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
    toast({ title: "Eliminado", description: "Integrante eliminado de la lista" })
  }

  const handleSaveEdit = async () => {
    if (!selectedBody) return
    const tempEditFormData = { ...editFormData, id: selectedBody.id }
    const tempMemberName = editFormData.memberName || selectedBody.memberName
    setEditDialogOpen(false)
    await new Promise(resolve => setTimeout(resolve, 100))
    const result = await confirmUpdate(`el integrante "${tempMemberName}"`)
    if (!result.isConfirmed) { setEditDialogOpen(true); return }
    showLoading("Actualizando integrante...", "Por favor espere")
    setIsLoading(true)
    try {
      const res = await fetch("/api/integrantes-organo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempEditFormData),
      })
      closeLoading()
      if (res.ok) {
        setSelectedBody(null)
        setEditFormData({})
        await showSuccess("¡Actualizado!", "Los cambios se guardaron correctamente")
        await loadGoverningBodies()
      } else {
        const error = await res.json()
        showError("Error al actualizar", error.error || "No se pudieron guardar los cambios")
        setEditDialogOpen(true)
      }
    } catch (error) {
      closeLoading()
      showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
      setEditDialogOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "CAPTURISTA"
  const isAdmin = currentUser?.role === "ADMIN"

  const openViewDialog = (id: number) => {
    const body = localGoverningBodies.find((b) => b.id === id)
    if (body) { setSelectedBody(body); setViewDialogOpen(true) }
  }

  const openEditDialog = (id: number) => {
    const body = localGoverningBodies.find((b) => b.id === id)
    if (body) {
      setSelectedBody(body)
      setEditFormData({ ...body, appointmentDate: formatDateForInput(body.appointmentDate) })
      setEditDialogOpen(true)
    }
  }

  const handleDelete = async (id: number, memberName: string) => {
    if (!isAdmin) { showError("Sin permisos", "Solo los administradores pueden eliminar registros"); return }
    const result = await confirmDelete(`el integrante "${memberName}"`)
    if (result.isConfirmed) {
      showLoading("Eliminando integrante...", "Por favor espere")
      try {
        const res = await fetch(`/api/integrantes-organo/${id}`, { method: "DELETE" })
        closeLoading()
        if (res.ok) {
          await showSuccess("¡Eliminado!", `${memberName} ha sido eliminado correctamente`)
          await loadGoverningBodies()
        } else {
          const error = await res.json()
          showError("Error al eliminar", error.error || "No se pudo eliminar el integrante")
        }
      } catch (error) {
        closeLoading()
        showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
      }
    }
  }

  const cancelBatchAdd = () => {
    setIsAddingBatch(false)
    setBatchMembers([])
    setEditingIndex(null)
    setFormData({ entityId: "", bodyType: "", memberName: "", position: "", appointmentDate: "", designationInstrument: "", status: "Activo", observations: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Integrantes</h1>
          <p className="text-muted-foreground mt-2">Integrantes de juntas, consejos y comités</p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsAddingBatch(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Integrantes
          </Button>
        )}
      </div>

      {/* ===== MODAL AGREGAR INTEGRANTES ===== */}
      <Dialog open={isAddingBatch} onOpenChange={(open) => { if (!open) cancelBatchAdd() }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto bg-white !w-[50vw] !max-w-[1400px] px-16 py-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Registro de Integrantes</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Complete el formulario y agregue múltiples integrantes antes de guardar
            </p>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Formulario nuevo integrante */}
            <div className="space-y-6 p-8 border border-border rounded-lg bg-gray-50 w-full">
              <h3 className="font-semibold text-lg">
                {editingIndex !== null ? "Editar Integrante" : "Nuevo Integrante"}
              </h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 w-full">
                <div className="space-y-2">
                  <Label htmlFor="entityId">Ente *</Label>
                  <Select
                    value={formData.entityId}
                    onValueChange={(value) => setFormData({ ...formData, entityId: value })}
                  >
                    <SelectTrigger className="w-full h-11">
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
                    className="w-full h-11"
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
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {batchMembers.map((member, index) => {
                    const entity = localEntities.find((e) => Number(e.id) === Number(member.entityId))
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 border border-border rounded-lg bg-white"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{member.memberName}</p>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                          <p className="text-xs text-muted-foreground">
                            {entity?.name} - {member.bodyType}
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
              <Button variant="outline" onClick={cancelBatchAdd} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBatch} disabled={batchMembers.length === 0 || isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Guardando..." : `Guardar Todos (${batchMembers.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
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
                  <Input id="edit-bodyType" value={editFormData.bodyType || ""} onChange={(e) => setEditFormData({ ...editFormData, bodyType: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-memberName">Nombre del Integrante</Label>
                  <Input id="edit-memberName" value={editFormData.memberName || ""} onChange={(e) => setEditFormData({ ...editFormData, memberName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Cargo</Label>
                  <Input id="edit-position" value={editFormData.position || ""} onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-appointmentDate">Fecha de Nombramiento</Label>
                  <Input id="edit-appointmentDate" type="date" value={editFormData.appointmentDate || ""} onChange={(e) => setEditFormData({ ...editFormData, appointmentDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estatus</Label>
                  <Select value={editFormData.status} onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Concluido">Concluido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-designationInstrument">Instrumento de Designación</Label>
                  <Input id="edit-designationInstrument" value={editFormData.designationInstrument || ""} onChange={(e) => setEditFormData({ ...editFormData, designationInstrument: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-observations">Observaciones</Label>
                  <Textarea id="edit-observations" value={editFormData.observations || ""} onChange={(e) => setEditFormData({ ...editFormData, observations: e.target.value })} rows={2} />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar Cambios"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabla de integrantes */}
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
                <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
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
              const entityName = body.entityName || localEntities.find((e) => Number(e.id) === Number(body.entityId))?.name
              return (
                <div key={body.id} className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
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
                      <p><strong>Ente:</strong> {entityName || "No especificado"}</p>
                      <p><strong>Órgano:</strong> {body.bodyType || "No especificado"}</p>
                      <p><strong>Nombramiento:</strong> {formatDate(body.appointmentDate)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(body.id)} title="Ver detalles">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(body.id)} title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(body.id, body.memberName)} title="Eliminar">
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