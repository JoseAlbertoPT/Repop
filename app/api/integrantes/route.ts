import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/* GET – listar integrantes */
export async function GET() {
  const [rows] = await db.query(`
    SELECT 
      i.id,
      i.nombre AS memberName,
      i.cargo AS position,
      i.fecha_nombramiento AS appointmentDate,
      i.estatus AS status,
      i.observaciones,
      i.instrumento_designacion AS designationInstrument,
      o.tipo_organo AS bodyType,
      o.ente_id AS entityId
    FROM integrantes_organo i
    JOIN organos_gobierno o ON i.organo_id = o.id
  `)

  return NextResponse.json(rows)
}

/* POST – crear integrante */
export async function POST(req: Request) {
  const data = await req.json()

  const {
    entityId,
    bodyType,
    memberName,
    position,
    appointmentDate,
    status,
    observations,
    designationInstrument,
  } = data

  // Buscar o crear órgano
  const [organo]: any = await db.query(
    "SELECT id FROM organos_gobierno WHERE ente_id=? AND tipo_organo=?",
    [entityId, bodyType]
  )

  let organoId = organo[0]?.id

  if (!organoId) {
    const [res]: any = await db.query(
      "INSERT INTO organos_gobierno (ente_id, tipo_organo) VALUES (?,?)",
      [entityId, bodyType]
    )
    organoId = res.insertId
  }

  await db.query(
    `INSERT INTO integrantes_organo
     (organo_id, nombre, cargo, fecha_nombramiento, estatus, observaciones, instrumento_designacion)
     VALUES (?,?,?,?,?,?,?)`,
    [
      organoId,
      memberName,
      position,
      appointmentDate,
      status,
      observations,
      designationInstrument,
    ]
  )

  return NextResponse.json({ ok: true })
}
