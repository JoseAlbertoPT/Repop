import { NextResponse } from "next/server"
import { db } from "@/lib/db"

//
//  OBTENER TODOS LOS DOCUMENTOS NORMATIVOS
//
export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        mn.id,
        mn.ente_id AS entityId,
        mn.tipo_documento AS type,
        mn.fecha_emision AS issueDate,
        mn.vigente AS validity,
        mn.archivo_url AS file
      FROM marco_normativo mn
      ORDER BY mn.id DESC
    `)

    return NextResponse.json(rows ?? [])
  } catch (error: any) {
    console.error(" ERROR EN /api/regulatory:", error.message)
    return NextResponse.json(
      { error: "Error al obtener documentos", detail: error.message },
      { status: 500 }
    )
  }
}

//
// CREAR DOCUMENTO NORMATIVO
//
export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.entityId || !data.type) {
      return NextResponse.json(
        { error: "Ente y tipo de documento son obligatorios" },
        { status: 400 }
      )
    }

    await db.query(
      `INSERT INTO marco_normativo 
        (ente_id, tipo_documento, fecha_emision, vigente, archivo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.entityId,
        data.type,
        data.issueDate || null,
        data.validity ?? true,
        data.file || null,
      ]
    )

    return NextResponse.json({ message: "Documento creado correctamente" })
  } catch (error: any) {
    console.error(" ERROR CREANDO DOCUMENTO:", error.message)
    return NextResponse.json(
      { error: "Error al crear documento", detail: error.message },
      { status: 500 }
    )
  }
}

