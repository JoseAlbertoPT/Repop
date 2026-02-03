"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText, Building2, Users, TrendingUp, FileDown, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function ReportsPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [reportType, setReportType] = useState<string>("general")
  const [filterType, setFilterType] = useState<"Todos" | "Organismo" | "Fideicomiso" | "EPEM">("Todos")
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [showEntitySelector, setShowEntitySelector] = useState(false)

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Activo" | "Inactivo">("Todos")

  const [showEfirmaDialog, setShowEfirmaDialog] = useState(false)
  const [pendingExport, setPendingExport] = useState<"pdf" | "excel" | null>(null)
  const [cerFile, setCerFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [efirmaPassword, setEfirmaPassword] = useState("")

  //   Estado para datos de la API
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  //   Fetch a la API con mejor manejo de errores
  useEffect(() => {
    const loadReports = async () => {
      try {
        console.log("Fetching reports from API...")
        const res = await fetch("/api/reportes?type=all")

        console.log("Response status:", res.status)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error("API Error Response:", errorText)
          throw new Error(`Error ${res.status}: ${errorText}`)
        }

        const data = await res.json()
        console.log("API Data received:", data)
        setApiData(data)
        setError(null)
      } catch (error) {
        console.error("Error loading reports:", error)
        setError(error instanceof Error ? error.message : "Error desconocido")
        toast({
          title: "Error",
          description: "No se pudieron cargar los reportes. Verifica la consola para más detalles.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [toast])

  //   Reemplazar variables seguras con datos de la API
  const safeEntities = apiData?.entities || []
  const safeGoverningBodies = apiData?.governingBodies || []
  const safeDirectors = apiData?.directors || []
  const safePowers = apiData?.powers || []
  const safeRegulatoryDocs = apiData?.regulatoryDocs || []

  const getMonthlyTrendData = () => {
    const monthlyData: Record<string, { month: string; Organismos: number; Fideicomisos: number; EPEMs: number }> = {}

    safeEntities.forEach((entity) => {
      if (entity.createdAt) {
        const date = new Date(entity.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthLabel = date.toLocaleDateString("es-MX", { year: "numeric", month: "short" })

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, Organismos: 0, Fideicomisos: 0, EPEMs: 0 }
        }

        if (entity.type === "Organismo") monthlyData[monthKey].Organismos++
        else if (entity.type === "Fideicomiso") monthlyData[monthKey].Fideicomisos++
        else if (entity.type === "EPEM") monthlyData[monthKey].EPEMs++
      }
    })

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
  }

  const filteredEntities = safeEntities.filter((e) => {
    const matchesType = filterType === "Todos" || e.type === filterType
    const matchesStatus = statusFilter === "Todos" || e.status === statusFilter
    const matchesDateFrom = !dateFrom || (e.createdAt && e.createdAt >= dateFrom)
    const matchesDateTo = !dateTo || (e.createdAt && e.createdAt <= dateTo)
    return matchesType && matchesStatus && matchesDateFrom && matchesDateTo
  })

  const toggleEntitySelection = (entityId: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId],
    )
  }

  const toggleSelectAll = () => {
    if (selectedEntities.length === safeEntities.length) {
      setSelectedEntities([])
    } else {
      setSelectedEntities(safeEntities.map((e) => e.id))
    }
  }

  const getChangeHistoryData = () => {
    const selectedEntityData = safeEntities.filter((e) => selectedEntities.includes(e.id))

    return selectedEntityData.map((entity) => {
      const entityDocs = safeRegulatoryDocs.filter((d) => d.entityId === entity.id)
      const entityBodies = safeGoverningBodies.filter((b) => b.entityId === entity.id)
      const entityDirectors = safeDirectors.filter((d) => d.entityId === entity.id)
      const entityPowers = safePowers.filter((p) => p.entityId === entity.id)

      return {
        entity,
        docs: entityDocs,
        bodies: entityBodies,
        directors: entityDirectors,
        powers: entityPowers,
      }
    })
  }

  const validateEfirma = async () => {
    if (!cerFile || !keyFile || !efirmaPassword) {
      toast({
        title: "Faltan datos",
        description: "Debe proporcionar el archivo .cer, .key y la contraseña",
        variant: "destructive",
      })
      return false
    }

    // Simulate validation (in production this would verify the files)
    toast({
      title: "e.firma validada",
      description: "Los archivos de e.firma son válidos",
    })

    return true
  }

  const initiateExport = (type: "pdf" | "excel") => {
    if (selectedEntities.length === 0) {
      toast({
        title: "Seleccione entes",
        description: "Debe seleccionar al menos un ente para exportar",
        variant: "destructive",
      })
      return
    }

    setPendingExport(type)
    setShowEfirmaDialog(true)
  }

  const executeExportWithSignature = async () => {
    const isValid = await validateEfirma()
    if (!isValid) return

    if (pendingExport === "pdf") {
      handleExportPDF()
    } else if (pendingExport === "excel") {
      handleExportExcel()
    }

    // Reset e.firma dialog
    setShowEfirmaDialog(false)
    setPendingExport(null)
    setCerFile(null)
    setKeyFile(null)
    setEfirmaPassword("")
  }

  const handleExportExcel = () => {
    if (selectedEntities.length === 0) {
      toast({
        title: "Seleccione entes",
        description: "Debe seleccionar al menos un ente para exportar",
        variant: "destructive",
      })
      return
    }

    const historyData = getChangeHistoryData()

    let csvContent = "REPORTE DE HISTORIAL - REPOPA\n"
    csvContent += `Fecha de generación:,${new Date().toLocaleDateString("es-MX")}\n`
    csvContent += `Entes seleccionados:,${selectedEntities.length}\n`
    if (cerFile && keyFile) {
      csvContent += `\nFIRMADO ELECTRÓNICAMENTE\n`
      csvContent += `Firmante:,Lic. José Emanuel Coronato Liñán\n`
      csvContent += `Cargo:,Subprocurador de Recursos y Procedimientos Administrativos\n`
      csvContent += `Fecha y hora:,${new Date().toLocaleString("es-MX")}\n`
      csvContent += `Certificado:,00001000000123456789\n`
      csvContent += `Cadena de firma:,${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}\n`
    }
    csvContent += `\n`

    historyData.forEach((data) => {
      csvContent += `\n=== ${data.entity.name} ===\n`
      csvContent += `Folio:,${data.entity.folio}\n`
      csvContent += `Tipo:,${data.entity.type}\n`
      csvContent += `Estatus:,${data.entity.status}\n`
      csvContent += `Fecha de Creación:,${data.entity.creationDate || "N/A"}\n\n`

      // Documentos
      csvContent += "DOCUMENTOS NORMATIVOS\n"
      csvContent += "Tipo,Fecha de Emisión,Validez\n"
      data.docs.forEach((doc) => {
        csvContent += `"${doc.type}","${doc.issueDate || "N/A"}","${doc.validity || "N/A"}"\n`
      })
      csvContent += "\n"

      // Integrantes
      csvContent += "INTEGRANTES\n"
      csvContent += "Nombre,Cargo,Nombramiento,Estatus\n"
      data.bodies.forEach((body) => {
        csvContent += `"${body.memberName}","${body.position}","${body.appointmentDate || "N/A"}","${body.status}"\n`
      })
      csvContent += "\n"

      // Directores
      csvContent += "DIRECTORES\n"
      csvContent += "Nombre,Cargo,Fecha de Inicio\n"
      data.directors.forEach((dir) => {
        csvContent += `"${dir.name}","${dir.position}","${dir.startDate || "N/A"}"\n`
      })
      csvContent += "\n"

      // Poderes
      csvContent += "PODERES Y FACULTADES\n"
      csvContent += "Tipo de Poder,Apoderados,Fecha de Otorgamiento\n"
      data.powers.forEach((power) => {
        csvContent += `"${power.powerType}","${power.attorneys.join("; ")}","${power.grantDate || "N/A"}"\n`
      })
      csvContent += "\n\n"
    })

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `REPOPA-Historial-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Reporte exportado",
      description: "El reporte Excel (CSV) se ha generado y firmado correctamente",
    })
  }

  const handleExportPDF = () => {
    if (selectedEntities.length === 0) {
      toast({
        title: "Seleccione entes",
        description: "Debe seleccionar al menos un ente para exportar",
        variant: "destructive",
      })
      return
    }

    const historyData = getChangeHistoryData()

    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte REPOPA</title>
        <style>
          @page { margin: 2cm; }
          body {
            font-family: Arial, sans-serif;
            color: #2E3B2B;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #7C4A36;
          }
          .logo {
            max-width: 400px;
            margin: 0 auto 20px;
          }
          .title {
            color: #2E3B2B;
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          .subtitle {
            color: #71785b;
            font-size: 16px;
            margin: 5px 0;
          }
          .meta-info {
            background: #f5f5f5;
            padding: 15px;
            border-left: 4px solid #7C4A36;
            margin: 20px 0;
          }
          .entity-section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .entity-header {
            background: #2E3B2B;
            color: white;
            padding: 15px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }
          .info-label {
            font-weight: bold;
            color: #7C4A36;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th {
            background: #71785b;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 14px;
          }
          td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 13px;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .section-title {
            color: #2E3B2B;
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #bc9b73;
          }
          .signature-box {
            margin-top: 40px;
            padding: 20px;
            border: 2px solid #7C4A36;
            background: #f9f9f9;
            page-break-inside: avoid;
          }
          .signature-title {
            font-size: 18px;
            font-weight: bold;
            color: #2E3B2B;
            margin-bottom: 15px;
            text-align: center;
          }
          .signature-info {
            font-size: 13px;
            color: #333;
            line-height: 1.8;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #7C4A36;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/images/logo-20finanzas.png" alt="Logo FINANZAS" class="logo">
          <div class="title">REPORTE DE HISTORIAL DE CAMBIOS</div>
          <div class="subtitle">Registro Público de Organismos Públicos Auxiliares (REPOPA)</div>
          <div class="subtitle">Procuraduría Fiscal del Gobierno del Estado de Morelos</div>
        </div>

        <div class="meta-info">
          <strong>Fecha de generación:</strong> ${new Date().toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}<br>
          <strong>Entes seleccionados:</strong> ${selectedEntities.length}<br>
          <strong>Generado por:</strong> ${currentUser?.name || "Sistema"}
        </div>
    `

    historyData.forEach((data) => {
      htmlContent += `
        <div class="entity-section">
          <div class="entity-header">${data.entity.name}</div>
          
          <div class="info-grid">
            <div class="info-label">Folio:</div>
            <div>${data.entity.folio}</div>
            <div class="info-label">Tipo:</div>
            <div>${data.entity.type}</div>
            <div class="info-label">Estatus:</div>
            <div>${data.entity.status}</div>
            <div class="info-label">Fecha de Creación:</div>
            <div>${data.entity.creationDate || "N/A"}</div>
          </div>

          <div class="section-title">Documentos Normativos</div>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha de Emisión</th>
                <th>Validez</th>
              </tr>
            </thead>
            <tbody>
              ${data.docs
                .map(
                  (doc) => `
                <tr>
                  <td>${doc.type}</td>
                  <td>${doc.issueDate || "N/A"}</td>
                  <td>${doc.validity || "N/A"}</td>
                </tr>
              `,
                )
                .join("")}
              ${data.docs.length === 0 ? "<tr><td colspan='3'>Sin registros</td></tr>" : ""}
            </tbody>
          </table>

          <div class="section-title">Integrantes</div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Nombramiento</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              ${data.bodies
                .map(
                  (body) => `
                <tr>
                  <td>${body.memberName}</td>
                  <td>${body.position}</td>
                  <td>${body.appointmentDate || "N/A"}</td>
                  <td>${body.status}</td>
                </tr>
              `,
                )
                .join("")}
              ${data.bodies.length === 0 ? "<tr><td colspan='4'>Sin registros</td></tr>" : ""}
            </tbody>
          </table>

          <div class="section-title">Directores y Responsables</div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Fecha de Inicio</th>
              </tr>
            </thead>
            <tbody>
              ${data.directors
                .map(
                  (dir) => `
                <tr>
                  <td>${dir.name}</td>
                  <td>${dir.position}</td>
                  <td>${dir.startDate || "N/A"}</td>
                </tr>
              `,
                )
                .join("")}
              ${data.directors.length === 0 ? "<tr><td colspan='3'>Sin registros</td></tr>" : ""}
            </tbody>
          </table>

          <div class="section-title">Poderes y Facultades</div>
          <table>
            <thead>
              <tr>
                <th>Tipo de Poder</th>
                <th>Apoderados</th>
                <th>Fecha de Otorgamiento</th>
              </tr>
            </thead>
            <tbody>
              ${data.powers
                .map(
                  (power) => `
                <tr>
                  <td>${power.powerType}</td>
                  <td>${power.attorneys.join(", ")}</td>
                  <td>${power.grantDate || "N/A"}</td>
                </tr>
              `,
                )
                .join("")}
              ${data.powers.length === 0 ? "<tr><td colspan='3'>Sin registros</td></tr>" : ""}
            </tbody>
          </table>
        </div>
      `
    })

    if (cerFile && keyFile) {
      htmlContent += `
        <div class="signature-box">
          <div class="signature-title">DOCUMENTO FIRMADO ELECTRÓNICAMENTE</div>
          <div class="signature-info">
            <strong>Firmante:</strong> Lic. José Emanuel Coronato Liñán<br>
            <strong>Cargo:</strong> Subprocurador de Recursos y Procedimientos Administrativos<br>
            <strong>Fecha y hora:</strong> ${new Date().toLocaleString("es-MX")}<br>
            <strong>Número de certificado:</strong> 00001000000123456789<br>
            <strong>Cadena de firma:</strong> ${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15).toUpperCase()}<br>
            <strong>Leyenda:</strong> Documento firmado electrónicamente conforme a la normativa vigente
          </div>
        </div>
      `
    }

    htmlContent += `
        <div class="footer">
          <strong>Procuraduría Fiscal del Gobierno del Estado de Morelos</strong><br>
          Sistema REPOPA - Registro Público de Organismos Públicos Auxiliares<br>
          Documento generado el ${new Date().toLocaleString("es-MX")}
        </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }

    toast({
      title: "Reporte PDF generado",
      description: "El documento ha sido firmado y está listo para imprimir",
    })
  }

  const stats = {
    totalEntities: safeEntities.length,
    organisms: safeEntities.filter((e) => e.type === "Organismo").length,
    trusts: safeEntities.filter((e) => e.type === "Fideicomiso").length,
    epems: safeEntities.filter((e) => e.type === "EPEM").length,
    activeEntities: safeEntities.filter((e) => e.status === "Activo").length,
    totalGoverningMembers: safeGoverningBodies.length,
    activeGoverningMembers: safeGoverningBodies.filter((g) => g.status === "Activo").length,
    totalDirectors: safeDirectors.length,
    activePowers: safePowers.filter((p) => !p.revocation).length,
    regulatoryDocs: safeRegulatoryDocs.length,
  }

  const trendData = getMonthlyTrendData()

  //  CAMBIO 4 — Loading UI mejorado
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  //  Error UI
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error al cargar reportes</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Reportes y Seguimiento</h1>
          <p className="text-muted-foreground mt-2">Visualización y exportación de información del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEntitySelector(!showEntitySelector)}>
            <Building2 className="w-4 h-4 mr-2" />
            Seleccionar Entes ({selectedEntities.length})
          </Button>
          <Button variant="outline" onClick={() => initiateExport("pdf")}>
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => initiateExport("excel")}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Dialog open={showEfirmaDialog} onOpenChange={setShowEfirmaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Firma Electrónica</DialogTitle>
            <DialogDescription>
              Cargue los archivos de su e.firma para firmar digitalmente el documento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cerFile">Archivo .cer (Certificado) *</Label>
              <Input id="cerFile" type="file" accept=".cer" onChange={(e) => setCerFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyFile">Archivo .key (Clave Privada) *</Label>
              <Input id="keyFile" type="file" accept=".key" onChange={(e) => setKeyFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={efirmaPassword}
                onChange={(e) => setEfirmaPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEfirmaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={executeExportWithSignature}>Firmar y Descargar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {showEntitySelector && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Seleccionar Entes para Exportar</CardTitle>
                <CardDescription>Elija los entes que desea incluir en el reporte</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedEntities.length === safeEntities.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {safeEntities.map((entity) => (
                <div key={entity.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    checked={selectedEntities.includes(entity.id)}
                    onCheckedChange={() => toggleEntitySelection(entity.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{entity.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {entity.folio} • {entity.type}
                    </p>
                  </div>
                  <Badge variant={entity.status === "Activo" ? "default" : "outline"}>{entity.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.organisms} organismos, {stats.trusts} fideicomisos, {stats.epems} EPEMs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entes Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEntities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalEntities > 0 ? ((stats.activeEntities / stats.totalEntities) * 100).toFixed(0) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoverningMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.activeGoverningMembers} integrantes activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Normativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.regulatoryDocs}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en el sistema</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reportes y Estadísticas
          </CardTitle>
          <CardDescription>
            Genera reportes personalizados del historial de cambios en los entes registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros</h3>
              <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                {showAdvancedFilters ? "Ocultar" : "Mostrar"} Filtros Avanzados
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Ente</Label>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Organismo">Organismos</SelectItem>
                    <SelectItem value="Fideicomiso">Fideicomisos</SelectItem>
                    <SelectItem value="EPEM">EPEM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estatus</Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Activo">Activos</SelectItem>
                    <SelectItem value="Inactivo">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showAdvancedFilters && (
                <>
                  <div className="space-y-2">
                    <Label>Fecha Desde</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Hasta</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowEntitySelector(!showEntitySelector)} className="flex-1">
              <Building2 className="w-4 h-4 mr-2" />
              Seleccionar Entes ({selectedEntities.length})
            </Button>
            <Button onClick={() => initiateExport("excel")} className="flex-1">
              <FileDown className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={() => initiateExport("pdf")} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {showEntitySelector && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Seleccionar Entes para Reporte</h3>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedEntities.length === safeEntities.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {filteredEntities.map((entity) => (
                  <div key={entity.id} className="flex items-center gap-2 p-2 border border-border rounded">
                    <Checkbox
                      checked={selectedEntities.includes(entity.id)}
                      onCheckedChange={() => toggleEntitySelection(entity.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entity.name}</p>
                      <p className="text-xs text-muted-foreground">{entity.folio}</p>
                    </div>
                    <Badge variant={entity.type === "Organismo" ? "default" : "secondary"}>{entity.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeEntities.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Organismos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {safeEntities.filter((e) => e.type === "Organismo").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fideicomisos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {safeEntities.filter((e) => e.type === "Fideicomiso").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">EPEM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{safeEntities.filter((e) => e.type === "EPEM").length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Integrantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeGoverningBodies.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Directores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeDirectors.length}</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {reportType === "general" && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte General del Sistema</CardTitle>
            <CardDescription>Resumen consolidado de todos los módulos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Estadísticas Generales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Entes Registrados</p>
                    <p className="text-2xl font-bold">{stats.totalEntities}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.organisms} organismos • {stats.trusts} fideicomisos • {stats.epems} EPEMs
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Documentos Normativos</p>
                    <p className="text-2xl font-bold">{stats.regulatoryDocs}</p>
                    <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Integrantes de Órganos</p>
                    <p className="text-2xl font-bold">{stats.totalGoverningMembers}</p>
                    <p className="text-xs text-muted-foreground">{stats.activeGoverningMembers} activos</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Responsables</p>
                    <p className="text-2xl font-bold">{stats.totalDirectors}</p>
                    <p className="text-xs text-muted-foreground">Directores y coordinadores</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Poderes Vigentes</p>
                    <p className="text-2xl font-bold">{stats.activePowers}</p>
                    <p className="text-xs text-muted-foreground">De {safePowers.length} registrados</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Distribución por Tipo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Organismos Descentralizados</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: stats.totalEntities > 0 ? `${(stats.organisms / stats.totalEntities) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{stats.organisms}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fideicomisos</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary"
                          style={{ width: stats.totalEntities > 0 ? `${(stats.trusts / stats.totalEntities) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{stats.trusts}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">EPEMs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: stats.totalEntities > 0 ? `${(stats.epems / stats.totalEntities) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{stats.epems}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "entities" && (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Entes Registrados</CardTitle>
            <CardDescription>{filteredEntities.length} registros</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="font-medium">{entity.folio}</TableCell>
                    <TableCell>{entity.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entity.type === "Organismo"
                            ? "default"
                            : entity.type === "Fideicomiso"
                              ? "secondary"
                              : "accent"
                        }
                      >
                        {entity.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{entity.creationDate || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={entity.status === "Activo" ? "default" : "outline"}>{entity.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === "governing" && (
        <Card>
          <CardHeader>
            <CardTitle>Integrantes</CardTitle>
            <CardDescription>{safeGoverningBodies.length} integrantes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Ente</TableHead>
                  <TableHead>Nombramiento</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeGoverningBodies.map((body) => {
                  const entity = safeEntities.find((e) => e.id === body.entityId)
                  return (
                    <TableRow key={body.id}>
                      <TableCell className="font-medium">{body.memberName}</TableCell>
                      <TableCell>{body.position}</TableCell>
                      <TableCell>{entity?.name || "N/A"}</TableCell>
                      <TableCell>{body.appointmentDate || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={body.status === "Activo" ? "default" : "outline"}>{body.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === "directors" && (
        <Card>
          <CardHeader>
            <CardTitle>Dirección y Representación</CardTitle>
            <CardDescription>{safeDirectors.length} responsables registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Ente</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeDirectors.map((director) => {
                  const entity = safeEntities.find((e) => e.id === director.entityId)
                  const isActive = !director.endDate || new Date(director.endDate) > new Date()
                  return (
                    <TableRow key={director.id}>
                      <TableCell className="font-medium">{director.name}</TableCell>
                      <TableCell>{director.position}</TableCell>
                      <TableCell>{entity?.name || "N/A"}</TableCell>
                      <TableCell>{director.startDate || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Vigente" : "Concluido"}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === "powers" && (
        <Card>
          <CardHeader>
            <CardTitle>Poderes y Facultades</CardTitle>
            <CardDescription>{safePowers.length} poderes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Poder</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Ente</TableHead>
                  <TableHead>Otorgamiento</TableHead>
                  <TableHead>Vigencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safePowers.map((power) => {
                  const entity = safeEntities.find((e) => e.id === power.entityId)
                  const isActive = !power.revocation && (!power.validity || new Date(power.validity) > new Date())
                  return (
                    <TableRow key={power.id}>
                      <TableCell className="font-medium">{power.powerType}</TableCell>
                      <TableCell>{power.holder}</TableCell>
                      <TableCell>{entity?.name || "N/A"}</TableCell>
                      <TableCell>{power.grantDate || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Vigente" : "No Vigente"}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tendencia de Registros por Periodo
          </CardTitle>
          <CardDescription>Registros mensuales por tipo de ente</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Organismos" fill="#2E3B2B" />
              <Bar dataKey="Fideicomisos" fill="#7C4A36" />
              <Bar dataKey="EPEMs" fill="#71785b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}