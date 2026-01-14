"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
import { useApp } from "@/lib/context/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, UserCog, File } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { handleFileUpload, getFileInfo, downloadFile } from "@/lib/file-utils"

export default function DirectorsPage() {
  const { entities, directors, addDirector, updateDirector, deleteDirector } = useApp()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEntity, setFilterEntity] = useState<string>("Todos")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<string>("")

  const [formData, setFormData] = useState({
    entityId: "",
    name: "",
    position: "",
    responsibilityType: "",
    startDate: "",
    endDate: "",
    supportDocument: "",
  })

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  const filteredDirectors = directors.filter((director) => {
    const entity = entities.find((e) => e.id === director.entityId)
    const matchesSearch =
      director.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      director.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = filterEntity === "Todos" || director.entityId === filterEntity
    return matchesSearch && matchesEntity
  })

  const handleAdd = () => {
    if (!formData.entityId || !formData.name || !formData.position) {
      toast({
        title: "Error",
        description: "Por favor complete los campos requeridos",
        variant: "destructive",
      })
      return
    }

    addDirector(formData)
    toast({
      title: "Director registrado",
      description: "El responsable ha sido registrado correctamente",
    })
    setIsAddDialogOpen(false)
    setUploadedFile("")
    setFormData({
      entityId: "",
      name: "",
      position: "",
      responsibilityType: "",
      startDate: "",
      endDate: "",
      supportDocument: "",
    })
  }

  const handleEdit = () => {
    if (selectedDirector) {
      updateDirector(selectedDirector, formData)
      toast({
        title: "Actualizado",
        description: "El registro ha sido actualizado correctamente",
      })
      setIsEditDialogOpen(false)
      setSelectedDirector(null)
    }
  }

  const handleDelete = (id: string) => {
    if (currentUser?.role !== "Administrador") {
      toast({
        title: "Sin permisos",
        description: "Solo los administradores pueden eliminar registros",
        variant: "destructive",
      })
      return
    }

    if (confirm("¿Está seguro de eliminar este registro?")) {
      deleteDirector(id)
      toast({
        title: "Eliminado",
        description: "El registro ha sido eliminado",
      })
    }
  }

  const openEditDialog = (id: string) => {
    const director = directors.find((d) => d.id === id)
    if (director) {
      setFormData(director)
      setSelectedDirector(id)
      setUploadedFile(director.supportDocument || "")
      setIsEditDialogOpen(true)
    }
  }

  const canEdit = currentUser?.role === "Administrador" || currentUser?.role === "Editor"

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploaded = await handleFileUpload(file)
    setUploadedFile(uploaded)
    setFormData({ ...formData, supportDocument: uploaded })
  }

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Responsable</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="entityId">Ente *</Label>
                  <Select
                    value={formData.entityId}
                    onValueChange={(value) => setFormData({ ...formData, entityId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un ente" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Nombramiento</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportDocument">Documento Soporte</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocFileUpload}
                    className="cursor-pointer"
                  />
                  {uploadedFile && (
                    <p className="text-sm text-muted-foreground">Archivo cargado: {getFileInfo(uploadedFile)?.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportDocument-text">Referencia del Documento</Label>
                  <Input
                    id="supportDocument-text"
                    value={formData.supportDocument}
                    onChange={(e) => setFormData({ ...formData, supportDocument: e.target.value })}
                    placeholder="Acta, oficio, decreto"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Responsables</CardTitle>
              <CardDescription>{filteredDirectors.length} responsables registrados</CardDescription>
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
                    <SelectItem key={entity.id} value={entity.id}>
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
                        <strong>Ente:</strong> {entity?.name}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {director.responsibilityType || "No especificado"}
                      </p>
                      <p>
                        <strong>Inicio:</strong> {director.startDate || "No especificado"}
                        {director.endDate && ` - Fin: ${director.endDate}`}
                      </p>
                      {director.supportDocument && (
                        <p>
                          <strong>Documento:</strong> {director.supportDocument}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(director.id)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {currentUser?.role === "Administrador" && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(director.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                      {director.supportDocument && getFileInfo(director.supportDocument)?.data && (
                        <Button variant="outline" size="sm" onClick={() => downloadFile(director.supportDocument)}>
                          <File className="w-4 h-4 mr-1" />
                          Descargar Documento
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredDirectors.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron responsables</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Responsable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ente</Label>
              <Select
                value={formData.entityId}
                onValueChange={(value) => setFormData({ ...formData, entityId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
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
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Responsabilidad</Label>
                <Input
                  value={formData.responsibilityType}
                  onChange={(e) => setFormData({ ...formData, responsibilityType: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Nombramiento</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Conclusión</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Documento Soporte</Label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={handleDocFileUpload} className="cursor-pointer" />
              {uploadedFile && (
                <p className="text-sm text-muted-foreground">Archivo cargado: {getFileInfo(uploadedFile)?.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Referencia del Documento</Label>
              <Input
                value={formData.supportDocument}
                onChange={(e) => setFormData({ ...formData, supportDocument: e.target.value })}
              />
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
    </div>
  )
}
