import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const data = await req.json()

  await db.query(
    `UPDATE integrantes_organo
     SET nombre=?, cargo=?, fecha_nombramiento=?, estatus=?, observaciones=?, instrumento_designacion=?
     WHERE id=?`,
    [
      data.memberName,
      data.position,
      data.appointmentDate,
      data.status,
      data.observations,
      data.designationInstrument,
      params.id,
    ]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  await db.query("DELETE FROM integrantes_organo WHERE id=?", [params.id])
  return NextResponse.json({ ok: true })
}
