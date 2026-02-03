"use client"

import { useState, useEffect } from "react"
import type { User, Entity } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Edit, Trash2, Building2, FileText, X, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

export default function EntitiesPage() {
  const { toast } = useToast()
  const [entities, setEntities] = useState<Entity[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("Todos")
  const [filterStatus, setFilterStatus] = useState("Todos")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)

  const [showConstanciaEfirmaDialog, setShowConstanciaEfirmaDialog] = useState(false)
  const [constanciaCerFile, setConstanciaCerFile] = useState<File | null>(null)
  const [constanciaKeyFile, setConstanciaKeyFile] = useState<File | null>(null)
  const [constanciaPassword, setConstanciaPassword] = useState("")
  const [pendingConstanciaEntity, setPendingConstanciaEntity] = useState<Entity | null>(null)

  const [formData, setFormData] = useState<any>({
    type: "OPD",
    name: "",
    purpose: "",
    address: "",
    creationInstrument: "",
    creationDate: "",
    officialPublication: "",
    observations: "",
    status: "Activo",
    hasBookAntecedents: false,
    bookAntecedents: [],
    requestLetter: "",
  })

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) setCurrentUser(JSON.parse(userStr))
  }, [])

  const loadEntities = async () => {
    try {
      const res = await fetch("/api/entes")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEntities(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los entes", variant: "destructive" })
    }
  }

  useEffect(() => { loadEntities() }, [])

  const resetForm = () => {
    setFormData({
      type: "OPD",
      name: "",
      purpose: "",
      address: "",
      creationInstrument: "",
      creationDate: "",
      officialPublication: "",
      observations: "",
      status: "Activo",
      hasBookAntecedents: false,
      bookAntecedents: [],
      requestLetter: "",
    })
  }

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/entes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Éxito", description: "Ente registrado correctamente" })
      setIsAddDialogOpen(false)
      resetForm()
      loadEntities()
    } catch {
      toast({ title: "Error", description: "No se pudo registrar", variant: "destructive" })
    }
  }

  const handleEdit = async () => {
    if (!selectedEntity) return
    try {
      const res = await fetch(`/api/entes/${selectedEntity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Actualizado", description: "Registro actualizado correctamente" })
      setIsEditDialogOpen(false)
      loadEntities()
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/entes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Eliminado", description: "Registro eliminado correctamente" })
      loadEntities()
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" })
    }
  }

  const openEditDialog = (id: string) => {
    const entity = entities.find(e => e.id === id)
    if (!entity) return
    setSelectedEntity(entity)
    setFormData({ ...entity })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (id: string) => {
    const entity = entities.find(e => e.id === id)
    if (!entity) return
    setSelectedEntity(entity)
    setIsViewDialogOpen(true)
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })

  const handleFileUpload = async (file: File) => await fileToBase64(file)

  const getFileInfo = () => ({ name: "Documento PDF" })

  const initiateConstanciaDownload = (entity: Entity) => {
    setPendingConstanciaEntity(entity)
    setShowConstanciaEfirmaDialog(true)
  }

  const executeConstanciaDownload = () => {
    if (!pendingConstanciaEntity) return
    const blob = new Blob([`Constancia ${pendingConstanciaEntity.folio}`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Constancia_${pendingConstanciaEntity.folio}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast({ title: "Constancia generada", description: `Descargada para ${pendingConstanciaEntity.name}` })
    setShowConstanciaEfirmaDialog(false)
  }

  const filteredEntities = entities.filter(e =>
    (e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.folio?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === "Todos" || e.type === filterType) &&
    (filterStatus === "Todos" || e.status === filterStatus)
  )

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "CAPTURISTA"
  const isAdmin = currentUser?.role === "ADMIN"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Identificación de Entes</h1>
          <p className="text-muted-foreground mt-2">Registro Público de Organismos Públicos Auxiliares</p>
        </div>
        
        {/* Add New Entity Dialog */}
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Ente</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Ente *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPD">Organismo Descentralizado</SelectItem>
                          <SelectItem value="Fideicomiso">Fideicomiso</SelectItem>
                          <SelectItem value="EPEM">EPEM</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre o Denominación Oficial *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre completo del organismo o fideicomiso"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Objeto o Finalidad *</Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Descripción del objeto o finalidad"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Domicilio</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Dirección completa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creationInstrument">Instrumento de Creación</Label>
                    <Input
                      id="creationInstrument"
                      value={formData.creationInstrument}
                      onChange={(e) => setFormData({ ...formData, creationInstrument: e.target.value })}
                      placeholder="Ley, Decreto, Contrato de fideicomiso"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creationDate">Fecha de Creación</Label>
                    <Input
                      id="creationDate"
                      type="date"
                      value={formData.creationDate}
                      onChange={(e) => setFormData({ ...formData, creationDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officialPublication">Publicación Oficial</Label>
                    <Input
                      id="officialPublication"
                      value={formData.officialPublication}
                      onChange={(e) => setFormData({ ...formData, officialPublication: e.target.value })}
                      placeholder="Referencia a la publicación oficial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestLetter">Oficio de Solicitud</Label>
                    <Input
                      id="requestLetter"
                      value={formData.requestLetter}
                      onChange={(e) => setFormData({ ...formData, requestLetter: e.target.value })}
                      placeholder="Número de oficio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observaciones Internas</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder="Notas adicionales para uso interno"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasBookAntecedents"
                        checked={formData.hasBookAntecedents}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hasBookAntecedents: checked as boolean })
                        }
                      />
                      <Label htmlFor="hasBookAntecedents" className="cursor-pointer">
                        Selecciona si existen antecedentes en libro
                      </Label>
                    </div>
                    {formData.hasBookAntecedents && (
                      <div className="mt-4 p-4 border border-border rounded-lg space-y-3">
                        <Label>Documentos PDF de Antecedentes</Label>
                        <Input
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files
                            if (files) {
                              const uploadPromises = Array.from(files).map((file) => handleFileUpload(file))
                              Promise.all(uploadPromises).then((uploaded) => {
                                setFormData({
                                  ...formData,
                                  bookAntecedents: [...formData.bookAntecedents, ...uploaded],
                                })
                              })
                            }
                          }}
                          className="cursor-pointer"
                        />
                        {formData.bookAntecedents.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Documentos cargados:</Label>
                            {formData.bookAntecedents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{getFileInfo(doc)?.name || `Documento ${index + 1}`}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newDocs = formData.bookAntecedents.filter((_, i) => i !== index)
                                    setFormData({ ...formData, bookAntecedents: newDocs })
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Registros</CardTitle>
              <CardDescription>{filteredEntities.length} entes registrados</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o folio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="OPD">Organismos</SelectItem>
                  <SelectItem value="Fideicomiso">Fideicomisos</SelectItem>
                  <SelectItem value="EPEM">EPEM</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Activo">Activos</SelectItem>
                  <SelectItem value="Inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEntities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`p-3 rounded-lg ${
                    entity.type === "OPD" 
                      ? "bg-primary/10 text-primary" 
                      : entity.type === "Fideicomiso" 
                        ? "bg-secondary/10 text-secondary" 
                        : "bg-tertiary/10 text-tertiary"
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{entity.name}</h3>
                      <p className="text-sm text-muted-foreground">Folio: {entity.folio}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        variant={
                          entity.type === "OPD"
                            ? "default"
                            : entity.type === "Fideicomiso"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {entity.type}
                      </Badge>
                      <Badge variant={entity.status === "Activo" ? "default" : "outline"}>{entity.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{entity.purpose}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openViewDialog(entity.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalles
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(entity.id)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => handleDelete(entity.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => initiateConstanciaDownload(entity)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Constancia
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredEntities.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron registros</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Registro</DialogTitle>
          </DialogHeader>
          {selectedEntity && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Folio</Label>
                  <p className="font-semibold">{selectedEntity.folio}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-semibold">{selectedEntity.type}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="font-semibold">{selectedEntity.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Objeto o Finalidad</Label>
                <p>{selectedEntity.purpose}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Domicilio</Label>
                <p>{selectedEntity.address || "No especificado"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Instrumento de Creación</Label>
                <p>{selectedEntity.creationInstrument || "No especificado"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha de Creación</Label>
                  <p>{selectedEntity.creationDate || "No especificado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estatus</Label>
                  <Badge variant={selectedEntity.status === "Activo" ? "default" : "outline"}>{selectedEntity.status}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Publicación Oficial</Label>
                <p>{selectedEntity.officialPublication || "No especificado"}</p>
              </div>
              {selectedEntity.requestLetter && (
                <div>
                  <Label className="text-muted-foreground">Oficio de Solicitud</Label>
                  <p>{selectedEntity.requestLetter}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Observaciones</Label>
                <p>{selectedEntity.observations || "Sin observaciones"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo de Ente</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPD">Organismo Descentralizado</SelectItem>
                    <SelectItem value="Fideicomiso">Fideicomiso</SelectItem>
                    <SelectItem value="EPEM">EPEM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estatus</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Objeto o Finalidad</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Domicilio</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Instrumento de Creación</Label>
              <Input
                value={formData.creationInstrument}
                onChange={(e) => setFormData({ ...formData, creationInstrument: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Creación</Label>
              <Input
                type="date"
                value={formData.creationDate}
                onChange={(e) => setFormData({ ...formData, creationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Publicación Oficial</Label>
              <Input
                value={formData.officialPublication}
                onChange={(e) => setFormData({ ...formData, officialPublication: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Oficio de Solicitud</Label>
              <Input
                value={formData.requestLetter}
                onChange={(e) => setFormData({ ...formData, requestLetter: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasBookAntecedents-edit"
                  checked={formData.hasBookAntecedents}
                  onChange={(e) => setFormData({ ...formData, hasBookAntecedents: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <Label htmlFor="hasBookAntecedents-edit" className="cursor-pointer">
                  Selecciona si existen antecedentes en libro
                </Label>
              </div>

              {formData.hasBookAntecedents && (
                <div className="space-y-2 pl-6">
                  <Label>Documentos PDF de Antecedentes</Label>
                  <div className="space-y-2">
                    {formData.bookAntecedents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={`Documento ${index + 1}`} readOnly className="flex-1" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (doc.startsWith("data:")) {
                              const link = document.createElement("a")
                              link.href = doc
                              link.download = `antecedente-${index + 1}.pdf`
                              link.click()
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDocs = formData.bookAntecedents.filter((_, i) => i !== index)
                            setFormData({ ...formData, bookAntecedents: newDocs })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const base64 = await fileToBase64(file)
                            setFormData({
                              ...formData,
                              bookAntecedents: [...formData.bookAntecedents, base64],
                            })
                            e.target.value = ""
                          }
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* E-firma Dialog for Constancia */}
      <Dialog open={showConstanciaEfirmaDialog} onOpenChange={setShowConstanciaEfirmaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Firma Electrónica</DialogTitle>
            <DialogDescription>
              Cargue los archivos de su e.firma para firmar digitalmente la constancia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="constancia-cerFile">Archivo .cer (Certificado) *</Label>
              <Input
                id="constancia-cerFile"
                type="file"
                accept=".cer"
                onChange={(e) => setConstanciaCerFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="constancia-keyFile">Archivo .key (Clave Privada) *</Label>
              <Input
                id="constancia-keyFile"
                type="file"
                accept=".key"
                onChange={(e) => setConstanciaKeyFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="constancia-password">Contraseña *</Label>
              <Input
                id="constancia-password"
                type="password"
                value={constanciaPassword}
                onChange={(e) => setConstanciaPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConstanciaEfirmaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={executeConstanciaDownload}>Firmar y Descargar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}