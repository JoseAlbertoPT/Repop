import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT 
        id,
        folio_inscripcion AS folio,
        nombre_oficial AS name,
        tipo_ente AS type,
        objeto AS purpose,
        domicilio AS address,
        estatus AS status
      FROM entes
      ORDER BY nombre_oficial ASC
    `)

    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.name || !data.type) {
      return NextResponse.json({ error: "Nombre y tipo son obligatorios" }, { status: 400 })
    }

    const folio = "REPOPA-" + Date.now()

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO entes 
      (folio_inscripcion, nombre_oficial, tipo_ente, objeto, domicilio, estatus)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        folio,
        data.name,
        data.type,
        data.purpose || "",
        data.address || "",
        data.status || "Activo",
      ]
    )

    return NextResponse.json({ id: result.insertId, folio })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
