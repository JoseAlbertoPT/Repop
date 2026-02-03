import { NextResponse } from "next/server"
import { db } from "@/lib/db"

//
//  ACTUALIZAR DOCUMENTO
//
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json()

    await db.query(
      `UPDATE marco_normativo
       SET ente_id = ?, tipo_documento = ?, fecha_emision = ?, vigente = ?, archivo_url = ?
       WHERE id = ?`,
      [
        data.entityId,
        data.type,
        data.issueDate || null,
        data.validity ?? true,
        data.file || null,
        params.id,
      ]
    )

    return NextResponse.json({ message: "Documento actualizado" })
  } catch (error: any) {
    console.error(" ERROR ACTUALIZANDO:", error.message)
    return NextResponse.json(
      { error: "Error al actualizar", detail: error.message },
      { status: 500 }
    )
  }
}

//
// ELIMINAR DOCUMENTO
//
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.query(`DELETE FROM marco_normativo WHERE id = ?`, [params.id])
    return NextResponse.json({ message: "Documento eliminado" })
  } catch (error: any) {
    console.error(" ERROR ELIMINANDO:", error.message)
    return NextResponse.json(
      { error: "Error al eliminar", detail: error.message },
      { status: 500 }
    )
  }
}
