"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
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
import { Plus, Search, Edit, Trash2, Award, Eye, File, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importar las funciones de SweetAlert2
import { 
  confirmDelete, 
  showSuccess, 
  showError, 
  showLoading, 
  closeLoading,
  confirmUpdate
} from '@/lib/swalUtils'

interface Power {
  id: number
  entityId: number
  powerType: string
  attorneys: string[] | string  
  grantDate: string | null
  revocationDate: string | null
  document: string | null
  fileUrl: string | null
  notes: string | null
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

const getAttorneysArray = (attorneys: string[] | string): string[] => {
  if (Array.isArray(attorneys)) {
    return attorneys
  }
  if (typeof attorneys === 'string') {
    try {
      const parsed = JSON.parse(attorneys)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  return []
}

export default function PowersPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEntity, setFilterEntity] = useState<string>("Todos")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedPower, setSelectedPower] = useState<Power | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const [powers, setPowers] = useState<Power[]>([])
  const [entities, setEntities] = useState<Entity[]>([])

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

  const loadPowers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/poderes")
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al cargar poderes")
      }
      const data = await res.json()
      setPowers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading powers:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los poderes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEntities()
    loadPowers()
  }, [])

  const filteredPowers = powers.filter((power) => {
    const entity = entities.find((e) => e.id === power.entityId)
    const attorneys = getAttorneysArray(power.attorneys)
    
    const matchesSearch =
      attorneys.some((attorney) => attorney.toLowerCase().includes(searchTerm.toLowerCase())) ||
      power.powerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = filterEntity === "Todos" || String(power.entityId) === filterEntity
    return matchesSearch && matchesEntity
  })

  const validateForm = (): boolean => {
    const errors: string[] = []
    
    if (!formData.entityId || formData.entityId.trim() === "") {
      errors.push("Debe seleccionar un ente")
    }
    
    if (!formData.powerType || formData.powerType.trim() === "") {
      errors.push("El tipo de poder es requerido")
    }
    
    const validAttorneys = formData.attorneys.filter((a) => a.trim() !== "")
    if (validAttorneys.length === 0) {
      errors.push("Debe agregar al menos un apoderado")
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const resetForm = () => {
    setFormData({
      entityId: "",
      powerType: "",
      attorneys: [""],
      grantDate: "",
      document: "",
    })
    setUploadedFile(null)
    setUploadedFileName("")
    setValidationErrors([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError("Archivo muy grande", "El archivo no debe superar los 5MB")
        return
      }
      setUploadedFile(file)
      setUploadedFileName(file.name)
    }
  }

  // Función handleAdd con SweetAlert2
  const handleAdd = async () => {
    if (!validateForm()) {
      showError("Error de validación", "Por favor corrija los errores antes de continuar")
      return
    }

    const validAttorneys = formData.attorneys.filter((a) => a.trim() !== "")
    
    showLoading("Guardando poder...", "Por favor espere")
    setIsLoading(true)

    try {
      let fileUrl = null
      if (uploadedFile) {
        try {
          const reader = new FileReader()
          fileUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error("Error al leer el archivo"))
            reader.readAsDataURL(uploadedFile)
          })
        } catch (error) {
          closeLoading()
          console.error("Error reading file:", error)
          showError("Error al procesar archivo", "No se pudo procesar el archivo adjunto")
          return
        }
      }

      const payload = {
        entityId: parseInt(formData.entityId),
        powerType: formData.powerType.trim(),
        attorneys: validAttorneys,  
        grantDate: formData.grantDate || null,
        document: formData.document.trim() || null,
        fileUrl: fileUrl,
      }

      console.log("📤 Enviando datos:", payload)

      const res = await fetch("/api/poderes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()
      console.log("Respuesta del servidor:", responseData)

      closeLoading()

      if (res.ok) {
        // Cerrar modal y limpiar ANTES de mostrar alerta
        setIsAddDialogOpen(false)
        resetForm()

        await showSuccess("¡Poder registrado!", "El poder ha sido registrado correctamente")
        
        await loadPowers()
      } else {
        console.error("Error response:", responseData)
        showError("Error al guardar", responseData.error || "Error desconocido al guardar el poder")
      }
    } catch (error) {
      closeLoading()
      console.error("Error saving power:", error)
      showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función handleEdit con SweetAlert2
  const handleEdit = async () => {
    if (!selectedPower) return

    if (!validateForm()) {
      showError("Error de validación", "Por favor corrija los errores antes de continuar")
      return
    }

    const validAttorneys = formData.attorneys.filter((a) => a.trim() !== "")
    
    // Guardar datos temporalmente antes de cerrar el modal
    const tempPowerId = selectedPower.id
    const tempPowerType = formData.powerType
    const tempUploadedFile = uploadedFile
    const tempFormData = { ...formData }
    const tempFileUrl = selectedPower.fileUrl

    // Cerrar el modal ANTES de mostrar la confirmación
    setIsEditDialogOpen(false)
    
    // Pequeño delay para que el modal se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 100))

    // Pedir confirmación
    const result = await confirmUpdate(`el poder "${tempPowerType}"`)
    
    if (!result.isConfirmed) {
      // Usuario canceló, volver a abrir el modal
      setIsEditDialogOpen(true)
      return
    }

    // Usuario confirmó, continuar con el guardado
    showLoading("Actualizando poder...", "Por favor espere")
    setIsLoading(true)

    try {
      let fileUrl = tempFileUrl
      if (tempUploadedFile) {
        const reader = new FileReader()
        fileUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error("Error al leer el archivo"))
          reader.readAsDataURL(tempUploadedFile)
        })
      }

      const payload = {
        id: tempPowerId,
        entityId: parseInt(tempFormData.entityId),
        powerType: tempFormData.powerType.trim(),
        attorneys: validAttorneys,  
        grantDate: tempFormData.grantDate || null,
        document: tempFormData.document.trim() || null,
        fileUrl: fileUrl,
      }

      const res = await fetch("/api/poderes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      closeLoading()

      if (res.ok) {
        // Limpiar estados
        setSelectedPower(null)
        resetForm()

        await showSuccess("¡Actualizado!", "Los cambios se guardaron correctamente")
        
        await loadPowers()
      } else {
        showError("Error al actualizar", responseData.error || "No se pudieron guardar los cambios")
        // Volver a abrir el modal si hay error
        setIsEditDialogOpen(true)
      }
    } catch (error) {
      closeLoading()
      console.error("Error updating power:", error)
      showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
      // Volver a abrir el modal si hay error
      setIsEditDialogOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Función handleDelete con SweetAlert2
  const handleDelete = async (id: number, powerType: string) => {
    // Verificar permisos
    if (currentUser?.role !== "ADMIN") {
      showError("Sin permisos", "Solo los administradores pueden eliminar registros")
      return
    }

    // Pedir confirmación
    const result = await confirmDelete(`el poder "${powerType}"`)
    
    if (result.isConfirmed) {
      // Mostrar loading
      showLoading("Eliminando poder...", "Por favor espere")
      setIsLoading(true)

      try {
        const res = await fetch(`/api/poderes?id=${id}`, {
          method: "DELETE",
        })

        closeLoading()

        if (res.ok) {
          await showSuccess("¡Eliminado!", `${powerType} ha sido eliminado correctamente`)
          await loadPowers()
        } else {
          const error = await res.json()
          showError("Error al eliminar", error.error || "No se pudo eliminar el poder")
        }
      } catch (error) {
        closeLoading()
        console.error("Error deleting power:", error)
        showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const openEditDialog = (power: Power) => {
    const attorneys = getAttorneysArray(power.attorneys)
    
    setFormData({
      entityId: String(power.entityId),
      powerType: power.powerType,
      attorneys: attorneys.length > 0 ? attorneys : [""],
      grantDate: formatDateForInput(power.grantDate),
      document: power.document || "",
    })
    setSelectedPower(power)
    setUploadedFileName(power.fileUrl ? "Archivo actual" : "")
    setValidationErrors([])
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (power: Power) => {
    setSelectedPower(power)
    setIsViewDialogOpen(true)
  }

  const downloadPowerFile = (fileUrl: string | null) => {
    if (!fileUrl) return
    
    try {
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = 'poder.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      showError("Error al descargar", "No se pudo descargar el archivo")
    }
  }

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "CAPTURISTA"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Poderes y Facultades</h1>
          <p className="text-muted-foreground mt-2">Control interno de poderes otorgados</p>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Poder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Poder</DialogTitle>
                <DialogDescription>Complete la información del poder otorgado</DialogDescription>
              </DialogHeader>
              
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

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
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {uploadedFileName && (
                    <p className="text-sm text-muted-foreground">Archivo cargado: {uploadedFileName}</p>
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
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
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
            <DialogTitle>Detalles del Poder</DialogTitle>
          </DialogHeader>
          {selectedPower && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ente</Label>
                  <p className="font-medium">
                    {entities.find((e) => e.id === selectedPower.entityId)?.name || "No especificado"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Poder</Label>
                  <p className="font-medium">{selectedPower.powerType}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Apoderados</Label>
                  <p className="font-medium">
                    {(() => {
                      const attorneys = getAttorneysArray(selectedPower.attorneys)
                      return attorneys.length > 0 ? attorneys.join(", ") : "No especificado"
                    })()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Otorgamiento</Label>
                  <p className="font-medium">{formatDate(selectedPower.grantDate)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Documento</Label>
                  <p className="font-medium">{selectedPower.document || "No especificado"}</p>
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
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            resetForm()
            setSelectedPower(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Poder</DialogTitle>
            <DialogDescription>Modifique la información del poder</DialogDescription>
          </DialogHeader>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ente *</Label>
              <Select
                value={formData.entityId}
                onValueChange={(value) => setFormData({ ...formData, entityId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un ente" />
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
              <Label>Tipo de Poder *</Label>
              <Input
                value={formData.powerType}
                onChange={(e) => setFormData({ ...formData, powerType: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Apoderado(s) *</Label>
              {formData.attorneys.map((attorney, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={attorney}
                    onChange={(e) => {
                      const newAttorneys = [...formData.attorneys]
                      newAttorneys[index] = e.target.value
                      setFormData({ ...formData, attorneys: newAttorneys })
                    }}
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
                onClick={() =>
                  setFormData({ ...formData, attorneys: [...formData.attorneys, ""] })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Otro Apoderado
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Nombramiento</Label>
              <Input
                type="date"
                value={formData.grantDate}
                onChange={(e) => setFormData({ ...formData, grantDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Documento del Poder</Label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              {uploadedFileName && (
                <p className="text-sm text-muted-foreground">Archivo: {uploadedFileName}</p>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isLoading}>
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
              <CardTitle>Poderes Registrados</CardTitle>
              <CardDescription>
                {isLoading ? "Cargando..." : `${filteredPowers.length} poderes en el sistema`}
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
            {filteredPowers.map((power) => {
              const entity = entities.find((e) => e.id === power.entityId)
              const attorneys = getAttorneysArray(power.attorneys)
              
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
                        <p className="text-sm text-muted-foreground">
                          Apoderados: {attorneys.length > 0 ? attorneys.join(", ") : "No especificado"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p>
                        <strong>Ente:</strong> {entity?.name || "No especificado"}
                      </p>
                      <p>
                        <strong>Otorgamiento:</strong> {formatDate(power.grantDate)}
                      </p>
                      {power.document && (
                        <p>
                          <strong>Documento:</strong> {power.document}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openViewDialog(power)}
                        className="bg-background rounded-lg"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      {canEdit && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEditDialog(power)}
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
                          onClick={() => handleDelete(power.id, power.powerType)}
                          className="bg-background rounded-lg"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      )}
                      {power.fileUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => downloadPowerFile(power.fileUrl)}
                          className="bg-background rounded-lg"
                        >
                          <File className="w-4 h-4 mr-2" />
                          Descargar Documento
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredPowers.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron poderes</p>
              </div>
            )}
            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Cargando poderes...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}