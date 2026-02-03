import { NextResponse } from "next/server"
import { db } from "@/lib/db"

function getIdFromUrl(req: Request) {
  const url = new URL(req.url)
  return url.pathname.split("/").pop()
}

export async function PUT(req: Request) {
  try {
    const id = getIdFromUrl(req)
    const data = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    await db.query(
      `UPDATE entes SET 
        nombre_oficial = ?, 
        tipo_ente = ?, 
        objeto = ?, 
        domicilio = ?, 
        estatus = ?
       WHERE id = ?`,
      [
        data.name,
        data.type,
        data.purpose,
        data.address,
        data.status,
        id,
      ]
    )

    return NextResponse.json({ message: "Actualizado correctamente" })
  } catch (error: any) {
    console.error("PUT ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const id = getIdFromUrl(req)

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    await db.query("DELETE FROM entes WHERE id = ?", [id])

    return NextResponse.json({ message: "Eliminado correctamente" })
  } catch (error: any) {
    console.error("DELETE ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
