"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
import { useApp } from "@/lib/context/app-context"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, FileText, File } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { handleFileUpload, getFileInfo, downloadFile } from "@/lib/file-utils"

export default function RegulatoryPage() {
  const { entities, regulatoryDocs, addRegulatoryDoc, updateRegulatoryDoc, deleteRegulatoryDoc } = useApp()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEntity, setFilterEntity] = useState<string>("Todos")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<string>("")

  const [formData, setFormData] = useState({
    entityId: "",
    type: "",
    issueDate: "",
    validity: "",
    file: "",
    notes: "",
  })

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  const filteredDocs = regulatoryDocs.filter((doc) => {
    const entity = entities.find((e) => e.id === doc.entityId)
    const matchesSearch =
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = filterEntity === "Todos" || doc.entityId === filterEntity
    return matchesSearch && matchesEntity
  })

  const handleAdd = () => {
    if (!formData.entityId || !formData.type) {
      toast({ title: "Error", description: "Complete los campos requeridos", variant: "destructive" })
      return
    }
    addRegulatoryDoc(formData)
    setIsAddDialogOpen(false)
    resetForm()
    setUploadedFile("")
    toast({ title: "Éxito", description: "Documento registrado" })
  }

  const handleEdit = () => {
    if (selectedDoc) {
      updateRegulatoryDoc(selectedDoc, formData)
      toast({ title: "Actualizado", description: "El documento ha sido actualizado correctamente" })
      setIsEditDialogOpen(false)
      setSelectedDoc(null)
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

    if (confirm("¿Está seguro de eliminar este documento?")) {
      deleteRegulatoryDoc(id)
      toast({ title: "Eliminado", description: "El documento ha sido eliminado" })
    }
  }

  const openEditDialog = (id: string) => {
    const doc = regulatoryDocs.find((d) => d.id === id)
    if (doc) {
      setFormData(doc)
      setSelectedDoc(id)
      setIsEditDialogOpen(true)
    }
  }

  const canEdit = currentUser?.role === "Administrador" || currentUser?.role === "Editor"

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploaded = await handleFileUpload(file)
    setUploadedFile(uploaded)
    setFormData({ ...formData, file: uploaded })
  }

  const resetForm = () => {
    setFormData({
      entityId: "",
      type: "",
      issueDate: "",
      validity: "",
      file: "",
      notes: "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Marco Normativo</h1>
          <p className="text-muted-foreground mt-2">Documentos rectores y contractuales</p>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Marco Normativo</DialogTitle>
                <DialogDescription>Complete la información del documento rector o contractual</DialogDescription>
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
                          {entity.name} ({entity.folio})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Documento *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Reglamento, Estatuto, Contrato de fideicomiso"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Fecha de Emisión</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Archivo Digital</Label>
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
                  <Label htmlFor="notes">Notas Internas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observaciones adicionales"
                    rows={3}
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
              <CardTitle>Documentos Normativos</CardTitle>
              <CardDescription>{filteredDocs.length} documentos registrados</CardDescription>
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
            {filteredDocs.map((doc) => {
              const entity = entities.find((e) => e.id === doc.entityId)
              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{doc.type}</h3>
                        <p className="text-sm text-muted-foreground">{entity?.name}</p>
                      </div>
                      {doc.validity && <Badge>{doc.validity}</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                      <p>Fecha: {doc.issueDate || "No especificada"}</p>
                      <p>Archivo: {doc.file || "No adjunto"}</p>
                    </div>
                    {doc.notes && <p className="text-sm text-muted-foreground mb-3">{doc.notes}</p>}
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(doc.id)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {currentUser?.role === "Administrador" && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                      {doc.file && (
                        <Button variant="outline" size="sm" onClick={() => downloadFile(doc.file)}>
                          <File className="w-4 h-4 mr-1" />
                          Descargar Archivo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredDocs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron documentos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
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
              <Label>Tipo de Documento</Label>
              <Input value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Emisión</Label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Archivo Digital</Label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={handleDocFileUpload} className="cursor-pointer" />
              {uploadedFile && (
                <p className="text-sm text-muted-foreground">Archivo cargado: {getFileInfo(uploadedFile)?.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
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
