"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { User, Power } from "@/lib/types"
import { useApp } from "@/lib/context/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Search, Edit, Trash2, Award, File } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { handleFileUpload, getFileInfo, downloadFile } from "@/lib/file-utils"

export default function PowersPage() {
  const { entities, powers, addPower, updatePower, deletePower } = useApp()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEntity, setFilterEntity] = useState<string>("Todos")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPower, setSelectedPower] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<string>("")

  const [formData, setFormData] = useState({
    entityId: "",
    powerType: "",
    attorneys: [""],
    grantDate: "",
    document: "",
  })

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  const filteredPowers = powers.filter((power) => {
    const entity = entities.find((e) => e.id === power.entityId)
    const matchesSearch =
      power.attorneys.some((attorney) => attorney.toLowerCase().includes(searchTerm.toLowerCase())) ||
      power.powerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = filterEntity === "Todos" || power.entityId === filterEntity
    return matchesSearch && matchesEntity
  })

  const handleAdd = () => {
    if (!formData.entityId || !formData.powerType || formData.attorneys.filter((a) => a.trim()).length === 0) {
      toast({
        title: "Error",
        description: "Complete los campos requeridos",
        variant: "destructive",
      })
      return
    }

    const newPower: Power = {
      id: Date.now().toString(),
      entityId: formData.entityId,
      powerType: formData.powerType,
      attorneys: formData.attorneys.filter((a) => a.trim()), // Filter empty attorneys
      grantDate: formData.grantDate,
      document: formData.document,
    }

    addPower(newPower)
    setIsAddDialogOpen(false)
    setUploadedFile("")
    setFormData({ entityId: "", powerType: "", attorneys: [""], grantDate: "", document: "" })
    toast({
      title: "Poder registrado",
      description: "El poder se ha registrado correctamente",
    })
  }

  const handleEdit = () => {
    if (selectedPower && editingId) {
      updatePower(editingId, formData)
      toast({
        title: "Actualizado",
        description: "El registro ha sido actualizado correctamente",
      })
      setIsEditDialogOpen(false)
      setSelectedPower(null)
      setEditingId(null)
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
      deletePower(id)
      toast({
        title: "Eliminado",
        description: "El registro ha sido eliminado",
      })
    }
  }

  const openEditDialog = (id: string) => {
    const power = powers.find((p) => p.id === id)
    if (power) {
      setFormData({
        entityId: power.entityId,
        powerType: power.powerType,
        attorneys: power.attorneys.length > 0 ? power.attorneys : [""], // Ensure at least one field
        grantDate: power.grantDate || "",
        document: power.document || "",
      })
      setEditingId(id)
      setUploadedFile(power.document || "")
      setIsEditDialogOpen(true)
    }
  }

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploaded = await handleFileUpload(file)
    setUploadedFile(uploaded)
    setFormData({ ...formData, document: uploaded })
  }

  const canEdit = currentUser?.role === "Administrador" || currentUser?.role === "Editor"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Poderes y Facultades</h1>
          <p className="text-muted-foreground mt-2">Control interno de poderes otorgados</p>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Poder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Poder</DialogTitle>
                <DialogDescription>Complete la información del poder otorgado</DialogDescription>
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
                  <Label htmlFor="powerType">Tipo de Poder *</Label>
                  <Input
                    id="powerType"
                    value={formData.powerType}
                    onChange={(e) => setFormData({ ...formData, powerType: e.target.value })}
                    placeholder="Poder general, especial, limitado..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apoderado(s) *</Label>
                  <div className="space-y-2">
                    {formData.attorneys.map((attorney, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={attorney}
                          onChange={(e) => {
                            const newAttorneys = [...formData.attorneys]
                            newAttorneys[index] = e.target.value
                            setFormData({ ...formData, attorneys: newAttorneys })
                          }}
                          placeholder={`Nombre del apoderado ${index + 1}`}
                          className="flex-1"
                        />
                        {formData.attorneys.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newAttorneys = formData.attorneys.filter((_, i) => i !== index)
                              setFormData({ ...formData, attorneys: newAttorneys })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, attorneys: [...formData.attorneys, ""] })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Otro Apoderado
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Puede agregar uno o múltiples apoderados para este poder
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grantDate">Fecha de Nombramiento</Label>
                  <Input
                    id="grantDate"
                    type="date"
                    value={formData.grantDate}
                    onChange={(e) => setFormData({ ...formData, grantDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">Documento del Poder</Label>
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
                  <Label htmlFor="document-ref">Referencia del Documento</Label>
                  <Input
                    id="document-ref"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="Escritura pública, acta notarial"
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
              <CardTitle>Poderes Registrados</CardTitle>
              <CardDescription>{filteredPowers.length} poderes en el sistema</CardDescription>
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
            {filteredPowers.map((power) => {
              const entity = entities.find((e) => e.id === power.entityId)
              return (
                <div
                  key={power.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{power.powerType}</h3>
                        <p className="text-sm text-muted-foreground">Apoderados: {power.attorneys.join(", ")}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p>
                        <strong>Ente:</strong> {entity?.name}
                      </p>
                      <p>
                        <strong>Otorgamiento:</strong> {power.grantDate || "No especificado"}
                      </p>
                      {power.document && (
                        <p>
                          <strong>Documento:</strong> {power.document}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(power.id)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {currentUser?.role === "Administrador" && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(power.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                      {power.document && getFileInfo(power.document)?.data && (
                        <Button variant="outline" size="sm" onClick={() => downloadFile(power.document)}>
                          <File className="w-4 h-4 mr-1" />
                          Descargar Documento
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredPowers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron poderes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Poder</DialogTitle>
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
              <Label>Tipo de Poder</Label>
              <Input
                value={formData.powerType}
                onChange={(e) => setFormData({ ...formData, powerType: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Apoderado(s)</Label>
              <div className="space-y-2">
                {formData.attorneys.map((attorney, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={attorney}
                      onChange={(e) => {
                        const newAttorneys = [...formData.attorneys]
                        newAttorneys[index] = e.target.value
                        setFormData({ ...formData, attorneys: newAttorneys })
                      }}
                      placeholder={`Nombre del apoderado ${index + 1}`}
                      className="flex-1"
                    />
                    {formData.attorneys.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newAttorneys = formData.attorneys.filter((_, i) => i !== index)
                          setFormData({ ...formData, attorneys: newAttorneys })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({ ...formData, attorneys: [...formData.attorneys, ""] })
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Otro Apoderado
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Otorgamiento</Label>
              <Input
                type="date"
                value={formData.grantDate}
                onChange={(e) => setFormData({ ...formData, grantDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Documento del Poder</Label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={handleDocFileUpload} className="cursor-pointer" />
              {uploadedFile && (
                <p className="text-sm text-muted-foreground">Archivo cargado: {getFileInfo(uploadedFile)?.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Referencia del Documento</Label>
              <Input
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
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
