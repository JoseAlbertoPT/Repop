import { NextResponse } from "next/server"
import { db } from "@/lib/db"

function getId(req: Request) {
  return new URL(req.url).pathname.split("/").pop()
}

export async function DELETE(req: Request) {
  try {
    const id = getId(req)

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    await db.query("DELETE FROM integrantes_organo WHERE id = ?", [id])

    return NextResponse.json({ message: "Eliminado correctamente" })
  } catch (error: any) {
    console.error("DELETE ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
