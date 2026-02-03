import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const [total]: any = await db.query("SELECT COUNT(*) as total FROM entes")
    const [organismos]: any = await db.query("SELECT COUNT(*) as total FROM entes WHERE tipo_ente = 'OPD'")
    const [fideicomisos]: any = await db.query("SELECT COUNT(*) as total FROM entes WHERE tipo_ente = 'FI'")
    const [epem]: any = await db.query("SELECT COUNT(*) as total FROM entes WHERE tipo_ente = 'EPEM'")

    const [recent]: any = await db.query(`
      SELECT id, nombre_oficial AS name, folio_inscripcion AS folio, tipo_ente
      FROM entes
      ORDER BY created_at DESC
      LIMIT 5
    `)

    return NextResponse.json({
      totalEntities: total[0].total,
      activeOrganisms: organismos[0].total,
      activeTrusts: fideicomisos[0].total,
      activeEPEM: epem[0].total,
      recentEntities: recent,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error cargando estadísticas" }, { status: 500 })
  }
}
