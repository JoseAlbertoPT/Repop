"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, Pencil, Trash2, Download } from "lucide-react"

// Importar las funciones de SweetAlert2
import { 
  confirmDelete, 
  showSuccess, 
  showError, 
  showLoading, 
  closeLoading,
  confirmUpdate
} from '@/lib/swalUtils'

export default function RegulatoryPage() {
  const [entities, setEntities] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [filterEntity, setFilterEntity] = useState("ALL")
  const [editing, setEditing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    entityId: "",
    type: "",
    issueDate: "",
    notes: "",
    file: null as File | null
  })

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } catch (error) {
        console.error("Error parsing user:", error)
      }
    }
  }, [])

  const loadData = async () => {
    try {
      const [entitiesRes, docsRes] = await Promise.all([
        fetch("/api/entes"),
        fetch("/api/marco-normativo")
      ])

      const entitiesData = await entitiesRes.json()
      const docsData = await docsRes.json()

      setEntities(Array.isArray(entitiesData) ? entitiesData : [])
      setDocs(Array.isArray(docsData) ? docsData : [])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredDocs = useMemo(() => {
    if (!Array.isArray(docs)) return []

    return docs.filter(doc => {
      const matchEntity = filterEntity === "ALL" || String(doc.entityId) === filterEntity
      const matchSearch = doc.type?.toLowerCase().includes(search.toLowerCase())
      return matchEntity && matchSearch
    })
  }, [docs, search, filterEntity])

  const getEntityName = (entityId: number) => {
    const entity = entities.find(e => e.id === entityId)
    return entity?.name || ""
  }

  const getFileName = (fileUrl: string | null) => {
    if (!fileUrl) return null
    const parts = fileUrl.split('/')
    const fullFileName = parts[parts.length - 1]
    const cleanFileName = fullFileName.replace(/^\d+-/, '')
    return cleanFileName
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "—"
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  }

  const openEdit = (doc: any) => {
    setEditing(doc)
    
    let formattedDate = ""
    if (doc.issueDate) {
      const date = new Date(doc.issueDate)
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0]
      } else {
        formattedDate = doc.issueDate
      }
    }
    
    setForm({
      entityId: String(doc.entityId),
      type: doc.type,
      issueDate: formattedDate,
      notes: doc.notes || "",
      file: null
    })
    setOpen(true)
  }

  const resetForm = () => {
    setForm({
      entityId: "",
      type: "",
      issueDate: "",
      notes: "",
      file: null
    })
  }

  // Función saveDoc con SweetAlert2
  const saveDoc = async () => {
    // Validación
    if (!form.entityId || !form.type) {
      showError("Campos requeridos", "Ente y tipo de documento son obligatorios")
      return
    }

    // Guardar datos temporalmente antes de cerrar el modal
    const tempForm = { ...form }
    const tempEditing = editing ? { ...editing } : null
    const isEditing = !!editing

    // Cerrar el modal ANTES de mostrar confirmación (solo si es edición)
    if (isEditing) {
      setOpen(false)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Pedir confirmación para edición
      const result = await confirmUpdate(`el documento "${tempForm.type}"`)
      
      if (!result.isConfirmed) {
        // Usuario canceló, volver a abrir el modal
        setOpen(true)
        return
      }
    }

    // Mostrar loading
    showLoading(isEditing ? "Actualizando documento..." : "Guardando documento...", "Por favor espere")
    setIsLoading(true)

    try {
      let archivoUrl: string | null = tempEditing?.file || null

      // Subir archivo si hay uno nuevo
      if (tempForm.file instanceof File) {
        const data = new FormData()
        data.append("file", tempForm.file)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: data,
        })

        if (!uploadRes.ok) {
          const errText = await uploadRes.text()
          console.error("UPLOAD ERROR:", errText)
          closeLoading()
          showError("Error al subir archivo", "No se pudo cargar el archivo. Intente nuevamente.")
          if (isEditing) setOpen(true)
          return
        }

        const upload = await uploadRes.json()
        archivoUrl = upload.url
      }

      const payload = {
        entityId: Number(tempForm.entityId),
        type: tempForm.type,
        issueDate: tempForm.issueDate || null,
        file: archivoUrl,
        notes: tempForm.notes || null
      }

      const res = await fetch("/api/marco-normativo", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...payload, id: tempEditing.id } : payload),
      })

      closeLoading()

      if (!res.ok) {
        const text = await res.text()
        console.error("SERVER ERROR:", text)
        showError("Error al guardar", "No se pudo guardar el documento. Intente nuevamente.")
        if (isEditing) setOpen(true)
        return
      }

      // Cerrar modal si no estaba cerrado (caso de creación)
      if (!isEditing) {
        setOpen(false)
      }
      
      // Limpiar estados
      setEditing(null)
      resetForm()

      // Mostrar éxito
      await showSuccess(
        isEditing ? "¡Actualizado!" : "¡Documento registrado!",
        isEditing ? "Los cambios se guardaron correctamente" : "El documento ha sido registrado correctamente"
      )

      // Recargar datos
      await loadData()
    } catch (err) {
      closeLoading()
      console.error("SAVE ERROR:", err)
      showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
      if (isEditing) setOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Función deleteDoc con SweetAlert2
  const deleteDoc = async (id: number, docType: string) => {
    // Verificar permisos
    if (currentUser?.role !== "ADMIN") {
      showError("Sin permisos", "Solo los administradores pueden eliminar documentos")
      return
    }

    // Pedir confirmación
    const result = await confirmDelete(`el documento "${docType}"`)
    
    if (result.isConfirmed) {
      // Mostrar loading
      showLoading("Eliminando documento...", "Por favor espere")

      try {
        const res = await fetch(`/api/marco-normativo?id=${id}`, { method: "DELETE" })

        closeLoading()

        if (res.ok) {
          // Mostrar éxito
          await showSuccess("¡Eliminado!", `${docType} ha sido eliminado correctamente`)
          await loadData()
        } else {
          const error = await res.json()
          showError("Error al eliminar", error.error || "No se pudo eliminar el documento")
        }
      } catch (error) {
        closeLoading()
        console.error("Error deleting document:", error)
        showError("Error de conexión", "No se pudo conectar con el servidor. Intente nuevamente.")
      }
    }
  }

  const canDelete = () => {
    return currentUser?.role === "ADMIN"
  }

  const canEdit = () => {
    return currentUser?.role === "ADMIN" || currentUser?.role === "CAPTURISTA"
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Marco Normativo</h1>
          <p className="text-muted-foreground">Documentos rectores y contractuales</p>
        </div>
        {canEdit() && (
          <Button onClick={() => { 
            setEditing(null); 
            resetForm(); 
            setOpen(true) 
          }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Documento
          </Button>
        )}
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Documentos Normativos</h2>
            <p className="text-sm text-muted-foreground">{filteredDocs.length} documentos registrados</p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-8 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los entes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los entes</SelectItem>
                {entities.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div className="flex gap-4 flex-1">
                <div className="bg-primary/10 p-3 rounded-lg min-w-[56px] h-14 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{doc.type}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{getEntityName(doc.entityId)}</p>
                  
                  <p className="text-sm mt-2">
                    Fecha: {formatDate(doc.issueDate)}
                    {doc.file && (
                      <span className="ml-4">Archivo: {getFileName(doc.file)}</span>
                    )}
                  </p>
                  
                  {doc.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {doc.notes}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    {canEdit() && (
                      <Button size="sm" variant="outline" onClick={() => openEdit(doc)}>
                        <Pencil className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    )}
                    
                    {canDelete() && (
                      <Button size="sm" variant="outline" onClick={() => deleteDoc(doc.id, doc.type)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                      </Button>
                    )}
                    
                    {doc.file && (
                      <a href={doc.file} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" /> Descargar Archivo
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs bg-black text-white px-2 py-1 rounded-full">Vigente</span>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron documentos</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nuevo"} Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Ente *</label>
              <Select value={form.entityId} onValueChange={(v) => setForm({ ...form, entityId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar ente" /></SelectTrigger>
                <SelectContent>
                  {entities.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Documento *</label>
              <Input 
                value={form.type} 
                onChange={(e) => setForm({ ...form, type: e.target.value })} 
                placeholder="Ej: Contrato de Fideicomiso"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Fecha de Emisión</label>
              <Input 
                type="date" 
                value={form.issueDate} 
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })} 
              />
            </div>

            <div>
              <label className="text-sm font-medium">Archivo Digital</label>
              {editing?.file && (
                <p className="text-xs text-muted-foreground mb-1">
                  Archivo actual: <a href={editing.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver archivo</a>
                </p>
              )}
              <Input 
                type="file" 
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} 
              />
              {editing?.file && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona un nuevo archivo solo si deseas reemplazar el actual
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Notas Internas</label>
              <textarea 
                className="w-full border rounded-md p-2 text-sm min-h-[80px] resize-y"
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones o comentarios internos..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={saveDoc} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}