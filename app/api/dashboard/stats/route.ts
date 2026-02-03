import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Total de entes (todos los registros activos)
    const [totalResult]: any = await db.query(`
      SELECT COUNT(*) as total 
      FROM entes 
      WHERE estatus = 'Activo'
    `)
    const totalEntities = totalResult[0]?.total || 0

    // Organismos Públicos Descentralizados (OPD)
    const [opdResult]: any = await db.query(`
      SELECT COUNT(*) as total 
      FROM entes 
      WHERE tipo_ente = 'OPD' AND estatus = 'Activo'
    `)
    const activeOrganisms = opdResult[0]?.total || 0

    // Fideicomisos (el valor real es "Fideicomiso", no "FI")
    const [fiResult]: any = await db.query(`
      SELECT COUNT(*) as total 
      FROM entes 
      WHERE tipo_ente = 'Fideicomiso' AND estatus = 'Activo'
    `)
    const activeTrusts = fiResult[0]?.total || 0

    // Empresas de Participación Estatal (el valor real es "Empresa Pública", no "EPEM")
    const [epemResult]: any = await db.query(`
      SELECT COUNT(*) as total 
      FROM entes 
      WHERE tipo_ente = 'Empresa Pública' AND estatus = 'Activo'
    `)
    const activeEPEM = epemResult[0]?.total || 0

    // Últimos 5 entes registrados
    const [recentEntities]: any = await db.query(`
      SELECT 
        id,
        nombre_oficial as name,
        folio_inscripcion as folio,
        tipo_ente
      FROM entes 
      WHERE estatus = 'Activo'
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    return NextResponse.json({
      totalEntities,
      activeOrganisms,
      activeTrusts,
      activeEPEM,
      recentEntities: recentEntities || []
    })

  } catch (error) {
    console.error("Error al cargar estadísticas del dashboard:", error)
    return NextResponse.json(
      { 
        error: "Error al cargar estadísticas",
        totalEntities: 0,
        activeOrganisms: 0,
        activeTrusts: 0,
        activeEPEM: 0,
        recentEntities: []
      },
      { status: 500 }
    )
  }
}