import { NextResponse } from "next/server"
import { db } from "@/lib/db"


//  OBTENER TODOS LOS DOCUMENTOS

export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        mn.id,
        mn.ente_id AS entityId,
        mn.tipo_documento AS type,
        mn.fecha_emision AS issueDate,
        mn.vigente AS validity,
        mn.archivo_url AS file,
        mn.notas AS notes
      FROM marco_normativo mn
      ORDER BY mn.id DESC
    `)

    return NextResponse.json(rows ?? [])
  } catch (error: any) {
    console.error("ERROR EN /api/marco-normativo:", error.message)
    return NextResponse.json(
      { error: "Error al obtener documentos", detail: error.message },
      { status: 500 }
    )
  }
}


//  CREAR DOCUMENTO

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.entityId || !data.type) {
      return NextResponse.json(
        { error: "Ente y tipo de documento son obligatorios" },
        { status: 400 }
      )
    }

    // Normalizar fecha (evita errores MySQL con "")
    let issueDate: string | null = null
    if (data.issueDate && data.issueDate !== "") {
      issueDate = data.issueDate
    }

    await db.query(
      `INSERT INTO marco_normativo 
        (ente_id, tipo_documento, fecha_emision, vigente, archivo_url, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(data.entityId),
        data.type,
        issueDate,
        data.validity ?? true,
        data.file || null,
        data.notes || null
      ]
    )

    return NextResponse.json({ message: "Documento creado correctamente" })
  } catch (error: any) {
    console.error("ERROR CREANDO DOCUMENTO:", error)
    return NextResponse.json(
      { error: "Error al crear documento", detail: error.message },
      { status: 500 }
    )
  }
}


// ACTUALIZAR DOCUMENTO

export async function PUT(req: Request) {
  try {
    const data = await req.json()

    let issueDate: string | null = null
    if (data.issueDate && data.issueDate !== "") {
      issueDate = data.issueDate
    }

    await db.query(
      `UPDATE marco_normativo 
       SET ente_id=?, tipo_documento=?, fecha_emision=?, vigente=?, archivo_url=?, notas=?
       WHERE id=?`,
      [
        Number(data.entityId),
        data.type,
        issueDate,
        data.validity ?? true,
        data.file || null,
        data.notes || null,
        data.id
      ]
    )

    return NextResponse.json({ message: "Documento actualizado" })
  } catch (error: any) {
    console.error("ERROR ACTUALIZANDO DOCUMENTO:", error)
    return NextResponse.json(
      { error: "Error al actualizar documento", detail: error.message },
      { status: 500 }
    )
  }
}

// ELIMINAR DOCUMENTO

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    await db.query(`DELETE FROM marco_normativo WHERE id=?`, [id])

    return NextResponse.json({ message: "Documento eliminado" })
  } catch (error: any) {
    console.error("ERROR ELIMINANDO DOCUMENTO:", error)
    return NextResponse.json(
      { error: "Error al eliminar documento", detail: error.message },
      { status: 500 }
    )
  }
}