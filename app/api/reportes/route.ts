import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Normaliza los tipos de ente de la BD a los nombres mostrados en la UI
function normalizeTipoEnte(tipo: string | null): string {
  if (!tipo) return 'N/A'
  const t = tipo.trim().toUpperCase()
  if (t === 'OPD') return 'Organismo'
  if (t === 'FIDEICOMISO') return 'Fideicomiso'
  if (t === 'EPEM') return 'EPEM'
  // Si no coincide con ninguno conocido, retorna el valor original
  return tipo
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get("type") || "all"

    console.log(" Generando reporte:", reportType)

    // ── ENTES ──────────────────────────────────────────
    const [entes]: any = await db.query(`
      SELECT * FROM entes
      ORDER BY nombre_oficial ASC
    `)

    console.log(" Entes obtenidos:", entes.length)
    if (entes.length > 0) {
      // Log útil para ver los valores reales de tipo_ente en la BD
      const tiposUnicos = [...new Set(entes.map((e: any) => e.tipo_ente))]
      console.log(" Tipos de ente encontrados en BD:", tiposUnicos)
    }

    const entesFormatted = entes.map((e: any) => ({
      id: e.id,
      folio: e.folio_inscripcion || e.id?.toString() || 'N/A',
      name: e.nombre_oficial || 'Sin nombre',
      type: normalizeTipoEnte(e.tipo_ente),   // ✅ Normalizar aquí
      status: e.estatus || 'Activo',
      creationDate: e.created_at || null,
      createdAt: e.created_at || null
    }))

    // ── INTEGRANTES ────────────────────────────────────
    const [integrantes]: any = await db.query(`
      SELECT io.*, e.nombre_oficial AS entityName
      FROM integrantes_organo io
      LEFT JOIN entes e ON e.id = io.organo_id
      ORDER BY io.nombre ASC
    `)

    console.log(" Integrantes obtenidos:", integrantes.length)

    const integrantesFormatted = integrantes.map((i: any) => ({
      id: i.id,
      entityId: i.organo_id,
      memberName: i.nombre || 'Sin nombre',
      position: i.cargo || 'N/A',
      appointmentDate: i.fecha_nombramiento,
      endDate: i.fecha_conclusion,
      status: i.estatus || 'Activo',
      entityName: i.entityName
    }))

    // ── REPRESENTANTES ─────────────────────────────────
    const [representantes]: any = await db.query(`
      SELECT r.*, e.nombre_oficial AS entityName
      FROM representantes r
      LEFT JOIN entes e ON e.id = r.ente_id
      ORDER BY r.nombre ASC
    `)

    console.log(" Representantes obtenidos:", representantes.length)

    const representantesFormatted = representantes.map((r: any) => ({
      id: r.id,
      entityId: r.ente_id,
      name: r.nombre || 'Sin nombre',
      position: r.cargo || 'N/A',
      startDate: r.fecha_inicio,
      endDate: r.fecha_fin,
      representationType: r.tipo_representacion,
      entityName: r.entityName
    }))

    // ── PODERES ────────────────────────────────────────
    const [poderes]: any = await db.query(`
      SELECT p.*, e.nombre_oficial AS entityName
      FROM poderes p
      LEFT JOIN entes e ON e.id = p.ente_id
      ORDER BY p.tipo_poder ASC
    `)

    console.log(" Poderes obtenidos:", poderes.length)

    for (const poder of poderes) {
      const [apoderados]: any = await db.query(
        "SELECT nombre FROM apoderados WHERE poder_id = ?",
        [poder.id]
      )
      poder.attorneys = apoderados.map((a: any) => a.nombre)
    }

    const poderesFormatted = poderes.map((p: any) => ({
      id: p.id,
      entityId: p.ente_id,
      powerType: p.tipo_poder || 'N/A',
      holder: p.attorneys && p.attorneys.length > 0 ? p.attorneys[0] : 'N/A',
      grantDate: p.fecha_nombramiento,
      revocation: p.fecha_revocacion || null,
      validity: p.vigencia || null,
      document: p.documento_archivo,
      attorneys: p.attorneys || [],
      entityName: p.entityName
    }))

    // ── MARCO NORMATIVO ────────────────────────────────
    const [marcoNormativo]: any = await db.query(`
      SELECT mn.*, e.nombre_oficial AS entityName
      FROM marco_normativo mn
      LEFT JOIN entes e ON e.id = mn.ente_id
      ORDER BY mn.fecha_emision DESC
    `)

    console.log(" Marco normativo obtenido:", marcoNormativo.length)

    const marcoNormativoFormatted = marcoNormativo.map((m: any) => ({
      id: m.id,
      entityId: m.ente_id,
      type: m.tipo_documento || 'N/A',
      issueDate: m.fecha_emision,
      validity: m.vigente ? 'Vigente' : 'No vigente',
      document: m.archivo_url,
      entityName: m.entityName
    }))

    // ── RESPUESTA ──────────────────────────────────────
    let response: any = {}

    switch (reportType) {
      case "entities":
        response = { entities: entesFormatted }
        break
      case "governing":
        response = { governingBodies: integrantesFormatted }
        break
      case "directors":
        response = { directors: representantesFormatted }
        break
      case "powers":
        response = { powers: poderesFormatted }
        break
      case "regulatory":
        response = { regulatoryDocs: marcoNormativoFormatted }
        break
      default:
        response = {
          entities: entesFormatted,
          governingBodies: integrantesFormatted,
          directors: representantesFormatted,
          powers: poderesFormatted,
          regulatoryDocs: marcoNormativoFormatted,
          stats: {
            totalEntities: entesFormatted.length,
            activeEntities: entesFormatted.filter((e: any) => e.status === "Activo").length,
            totalGoverningMembers: integrantesFormatted.length,
            totalDirectors: representantesFormatted.length,
            activePowers: poderesFormatted.filter((p: any) => !p.revocation).length,
            regulatoryDocs: marcoNormativoFormatted.length,
          },
        }
    }

    console.log(" Reporte generado correctamente")
    return NextResponse.json(response)

  } catch (error: any) {
    console.error(" ERROR /api/reportes:", error)
    return NextResponse.json(
      {
        error: "Error al generar el reporte",
        message: error.message,
        details: error.sqlMessage || error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log(" Reporte personalizado:", body)

    const {
      selectedEntities = [],
      filterType = "Todos",
      statusFilter = "Todos",
    } = body

    let where: string[] = []
    let params: any[] = []

    if (selectedEntities.length > 0) {
      const placeholders = selectedEntities.map(() => "?").join(",")
      where.push(`id IN (${placeholders})`)
      params.push(...selectedEntities)
    }

    //  Mapear el valor de la UI ("Organismo") al valor real en BD ("OPD")
    if (filterType !== "Todos") {
      const tipoMap: Record<string, string> = {
        "Organismo": "OPD",
        "Fideicomiso": "Fideicomiso",
        "EPEM": "EPEM"
      }
      where.push("tipo_ente = ?")
      params.push(tipoMap[filterType] || filterType)
    }

    if (statusFilter !== "Todos") {
      where.push("estatus = ?")
      params.push(statusFilter)
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : ""

    const [entes]: any = await db.query(
      `SELECT * FROM entes ${whereClause} ORDER BY nombre_oficial ASC`,
      params
    )

    const entesFormatted = entes.map((e: any) => ({
      id: e.id,
      folio: e.folio_inscripcion || e.id?.toString() || 'N/A',
      name: e.nombre_oficial || 'Sin nombre',
      type: normalizeTipoEnte(e.tipo_ente),   //  Normalizar aquí también
      status: e.estatus || 'Activo',
      creationDate: e.created_at || null,
      createdAt: e.created_at || null
    }))

    return NextResponse.json({ entities: entesFormatted })

  } catch (error: any) {
    console.error(" ERROR POST /api/reportes:", error)
    return NextResponse.json(
      { error: "Error en reporte personalizado", message: error.message },
      { status: 500 }
    )
  }
}