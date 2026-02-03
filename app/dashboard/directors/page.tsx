"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, UserCog, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Director {
  id: number
  entityId: number
  name: string
  position: string
  responsibilityType: string
  startDate: string
  endDate: string
  supportDocument: string
  observations: string
}

interface Entity {
  id: number
  folio: string
  name: string
  type: string
  purpose: string
  address: string
  status: string
}

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

export default function DirectorsPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEntity, setFilterEntity] = useState<string>("Todos")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [directors, setDirectors] = useState<Director[]>([])
  const [entities, setEntities] = useState<Entity[]>([])

  const [formData, setFormData] = useState({
    entityId: "",
    name: "",
    position: "",
    responsibilityType: "",
    startDate: "",
    supportDocument: "",
    supportDocumentFile: null as File | null,
    observations: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, supportDocumentFile: file, supportDocument: file.name })
    }
  }

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  // Cargar los entes desde la API
  const loadEntities = async () => {
    try {
      const res = await fetch("/api/entes")
      const data = await res.json()
      console.log("Entes cargados:", data)
      setEntities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading entities:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los entes",
        variant: "destructive",
      })
      setEntities([])
    }
  }

  const loadDirectors = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/representantes")
      const data = await res.json()
      console.log("Representantes cargados:", data)
      setDirectors(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading directors:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los representantes",
        variant: "destructive",
      })
      setDirectors([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEntities()
    loadDirectors()
  }, [])

  const filteredDirectors = directors.filter((director) => {
    const entity = entities.find((e) => e.id === director.entityId)
    const matchesSearch =
      director.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      director.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = filterEntity === "Todos" || String(director.entityId) === filterEntity
    return matchesSearch && matchesEntity
  })

  const handleAdd = async () => {
    if (!formData.entityId || !formData.name || !formData.position) {
      toast({
        title: "Error",
        description: "Por favor complete los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/representantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: "Director registrado",
          description: "El responsable ha sido registrado correctamente",
        })
        setIsAddDialogOpen(false)
        setFormData({
          entityId: "",
          name: "",
          position: "",
          responsibilityType: "",
          startDate: "",
          supportDocument: "",
          supportDocumentFile: null,
          observations: "",
        })
        await loadDirectors()
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Error al guardar",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving director:", error)
      toast({
        title: "Error",
        description: "Error al guardar representante",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedDirector) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/representantes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: selectedDirector.id }),
      })

      if (res.ok) {
        toast({
          title: "Actualizado",
          description: "El registro ha sido actualizado correctamente",
        })
        setIsEditDialogOpen(false)
        setSelectedDirector(null)
        await loadDirectors()
      }
    } catch (error) {
      console.error("Error updating director:", error)
      toast({
        title: "Error",
        description: "Error al actualizar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (currentUser?.role !== "ADMIN") {
      toast({
        title: "Sin permisos",
        description: "Solo los administradores pueden eliminar registros",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch(`/api/representantes?id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Eliminado",
          description: "El registro ha sido eliminado",
        })
        await loadDirectors()
      }
    } catch (error) {
      console.error("Error deleting director:", error)
      toast({
        title: "Error",
        description: "Error al eliminar",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (director: Director) => {
    setFormData({
      entityId: String(director.entityId),
      name: director.name,
      position: director.position,
      responsibilityType: director.responsibilityType,
      startDate: formatDateForInput(director.startDate),
      supportDocument: director.supportDocument,
      supportDocumentFile: null,
      observations: director.observations,
    })
    setSelectedDirector(director)
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (director: Director) => {
    setSelectedDirector(director)
    setIsViewDialogOpen(true)
  }

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "CAPTURISTA"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Dirección y Representación</h1>
          <p className="text-muted-foreground mt-2">Responsables operativos y representantes legales</p>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Responsable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Responsable</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="entityId">Ente *</Label>
                  <Select value={formData.entityId} onValueChange={(value) => setFormData({ ...formData, entityId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un ente" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.length === 0 ? (
                        <SelectItem value="ninguno" disabled>
                          No hay entes disponibles
                        </SelectItem>
                      ) : (
                        entities.map((entity) => (
                          <SelectItem key={entity.id} value={String(entity.id)}>
                            {entity.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo *</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Director General, Coordinador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibilityType">Tipo de Responsabilidad</Label>
                    <Input
                      id="responsibilityType"
                      value={formData.responsibilityType}
                      onChange={(e) => setFormData({ ...formData, responsibilityType: e.target.value })}
                      placeholder="Dirección, Representación"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Nombramiento</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportDocument">Documento Soporte</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="supportDocument"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="cursor-pointer"
                    />
                  </div>
                  {formData.supportDocumentFile && (
                    <p className="text-sm text-muted-foreground">
                      Archivo seleccionado: {formData.supportDocumentFile.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Registrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Diálogo de ver detalles */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Responsable</DialogTitle>
          </DialogHeader>
          {selectedDirector && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ente</Label>
                  <p className="font-medium">
                    {entities.find((e) => e.id === selectedDirector.entityId)?.name || "No encontrado"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Responsabilidad</Label>
                  <p className="font-medium">{selectedDirector.responsibilityType || "No especificado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedDirector.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cargo</Label>
                  <p className="font-medium">{selectedDirector.position}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Nombramiento</Label>
                  <p className="font-medium">{formatDate(selectedDirector.startDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Conclusión</Label>
                  <p className="font-medium">{formatDate(selectedDirector.endDate)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Documento Soporte</Label>
                  <p className="font-medium">{selectedDirector.supportDocument || "No especificado"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Observaciones</Label>
                  <p className="font-medium">{selectedDirector.observations || "Sin observaciones"}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Responsable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ente</Label>
              <Select value={formData.entityId} onValueChange={(value) => setFormData({ ...formData, entityId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={String(entity.id)}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Responsabilidad</Label>
                <Input
                  value={formData.responsibilityType}
                  onChange={(e) => setFormData({ ...formData, responsibilityType: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Nombramiento</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Documento Soporte</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="cursor-pointer"
                />
              </div>
              {formData.supportDocument && (
                <p className="text-sm text-muted-foreground">
                  Documento actual: {formData.supportDocument}
                </p>
              )}
              {formData.supportDocumentFile && (
                <p className="text-sm text-muted-foreground">
                  Nuevo archivo: {formData.supportDocumentFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Responsables</CardTitle>
              <CardDescription>
                {isLoading ? "Cargando..." : `${filteredDirectors.length} responsables registrados`}
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
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos los entes</SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={String(entity.id)}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDirectors.map((director) => {
              const entity = entities.find((e) => e.id === director.entityId)
              const isActive = !director.endDate || new Date(director.endDate) > new Date()

              return (
                <div
                  key={director.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <UserCog className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{director.name}</h3>
                        <p className="text-sm text-muted-foreground">{director.position}</p>
                      </div>
                      <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Vigente" : "Concluido"}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p>
                        <strong>Ente:</strong> {entity?.name || "No encontrado"}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {director.responsibilityType || "No especificado"}
                      </p>
                      <p>
                        <strong>Inicio:</strong> {formatDate(director.startDate)}
                        {director.endDate && ` - Fin: ${formatDate(director.endDate)}`}
                      </p>
                      {director.supportDocument && (
                        <p>
                          <strong>Documento:</strong> {director.supportDocument}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(director)}
                        className="bg-background rounded-lg"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(director)}
                          className="bg-background rounded-lg"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      )}
                      {currentUser?.role === "ADMIN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(director.id)}
                          className="bg-background rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredDirectors.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron responsables</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Cargando responsables...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}