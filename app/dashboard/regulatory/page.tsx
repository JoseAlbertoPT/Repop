"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, Pencil, Trash2, Download } from "lucide-react"

export default function RegulatoryPage() {
  const [entities, setEntities] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [filterEntity, setFilterEntity] = useState("ALL")
  const [editing, setEditing] = useState<any>(null)

  const [form, setForm] = useState({
    entityId: "",
    type: "",
    issueDate: "",
    notes: "",
    file: null as File | null
  })

  useEffect(() => {
    fetch("/api/entes")
      .then(r => r.json())
      .then(data => setEntities(Array.isArray(data) ? data : []))

    fetch("/api/marco-normativo")
      .then(r => r.json())
      .then(data => setDocs(Array.isArray(data) ? data : []))
  }, [])

  const filteredDocs = useMemo(() => {
    if (!Array.isArray(docs)) return []

    return docs.filter(doc => {
      const matchEntity = filterEntity === "ALL" || String(doc.entityId) === filterEntity
      const matchSearch = doc.type?.toLowerCase().includes(search.toLowerCase())
      return matchEntity && matchSearch
    })
  }, [docs, search, filterEntity])

  // Función para obtener el nombre del ente
  const getEntityName = (entityId: number) => {
    const entity = entities.find(e => e.id === entityId)
    return entity?.name || ""
  }

  // Función para extraer el nombre del archivo de la URL
  const getFileName = (fileUrl: string | null) => {
    if (!fileUrl) return null
    const parts = fileUrl.split('/')
    return parts[parts.length - 1]
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

  const saveDoc = async () => {
    try {
      if (!form.entityId || !form.type) {
        alert("Ente y tipo de documento son obligatorios")
        return
      }

      let archivoUrl: string | null = editing?.file || null

      // Subir archivo si hay uno nuevo
      if (form.file instanceof File) {
        const data = new FormData()
        data.append("file", form.file)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: data,
        })

        if (!uploadRes.ok) {
          const errText = await uploadRes.text()
          console.error("UPLOAD ERROR:", errText)
          alert("Error subiendo archivo")
          return
        }

        const upload = await uploadRes.json()
        archivoUrl = upload.url
      }

      const payload = {
        entityId: Number(form.entityId),
        type: form.type,
        issueDate: form.issueDate || null,
        validity: true,
        file: archivoUrl,
        notes: form.notes || null
      }

      const res = await fetch("/api/marco-normativo", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload),
      })

      const text = await res.text()

      if (!res.ok) {
        console.error("SERVER ERROR:", text)
        alert("Error guardando documento")
        return
      }

      location.reload()
    } catch (err) {
      console.error("SAVE ERROR:", err)
      alert("Error inesperado al guardar")
    }
  }

  const deleteDoc = async (id: number) => {
    await fetch(`/api/marco-normativo?id=${id}`, { method: "DELETE" })
    location.reload()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Marco Normativo</h1>
          <p className="text-muted-foreground">Documentos rectores y contractuales</p>
        </div>
        <Button onClick={() => { 
          setEditing(null); 
          setForm({ entityId: "", type: "", issueDate: "", notes: "", file: null }); 
          setOpen(true) 
        }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Documento
        </Button>
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
                    Fecha: {doc.issueDate || "—"}
                    {doc.file && (
                      <span className="ml-120">Archivo: {getFileName(doc.file)}</span>
                    )}
                  </p>
                  
                  {doc.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {doc.notes}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(doc)}>
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteDoc(doc.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                    </Button>
                    {doc.file && (
                      <a href={doc.file} target="_blank">
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
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nuevo"} Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Ente</label>
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
              <label className="text-sm font-medium">Tipo de Documento</label>
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
                  Archivo actual: <a href={editing.file} target="_blank" className="text-blue-600 hover:underline">Ver archivo</a>
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
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={saveDoc}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}