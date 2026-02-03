import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// OBTENER TODOS LOS INTEGRANTES
export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        id,
        organo_id AS entityId,
        tipo_organo AS bodyType,
        nombre AS memberName,
        cargo AS position,
        fecha_nombramiento AS appointmentDate,
        archivo_nombramiento AS designationInstrument,
        estatus AS status,
        notas AS observations
      FROM integrantes_organo
      ORDER BY id DESC
    `)

    return NextResponse.json(rows ?? [])
  } catch (error: any) {
    console.error("ERROR EN /api/integrantes-organo:", error.message)
    return NextResponse.json(
      { error: "Error al obtener integrantes", detail: error.message },
      { status: 500 }
    )
  }
}

// CREAR INTEGRANTE
export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    console.log("Datos recibidos en POST:", data)

    if (!data.entityId || !data.memberName || !data.position) {
      return NextResponse.json(
        { error: "Ente, nombre y cargo son obligatorios" },
        { status: 400 }
      )
    }

    // Convertir entityId de string a number
    const entityIdNum = parseInt(data.entityId)
    if (isNaN(entityIdNum)) {
      return NextResponse.json(
        { error: "ID de ente inválido" },
        { status: 400 }
      )
    }

    let appointmentDate: string | null = null
    if (data.appointmentDate && data.appointmentDate !== "") {
      appointmentDate = data.appointmentDate
    }

    const result = await db.query(
      `INSERT INTO integrantes_organo 
        (organo_id, tipo_organo, nombre, cargo, fecha_nombramiento, archivo_nombramiento, estatus, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entityIdNum,
        data.bodyType || null,
        data.memberName,
        data.position,
        appointmentDate,
        data.designationInstrument || null,
        data.status || 'Activo',
        data.observations || null
      ]
    )

    console.log("Resultado de INSERT:", result)

    return NextResponse.json({ 
      message: "Integrante creado correctamente",
      id: (result as any).insertId 
    })
  } catch (error: any) {
    console.error("ERROR CREANDO INTEGRANTE:", error)
    return NextResponse.json(
      { error: "Error al crear integrante", detail: error.message },
      { status: 500 }
    )
  }
}

// ACTUALIZAR INTEGRANTE
export async function PUT(req: Request) {
  try {
    const data = await req.json()

    const entityIdNum = parseInt(data.entityId)
    if (isNaN(entityIdNum)) {
      return NextResponse.json(
        { error: "ID de ente inválido" },
        { status: 400 }
      )
    }

    let appointmentDate: string | null = null
    if (data.appointmentDate && data.appointmentDate !== "") {
      appointmentDate = data.appointmentDate
    }

    await db.query(
      `UPDATE integrantes_organo 
       SET organo_id=?, tipo_organo=?, nombre=?, cargo=?, fecha_nombramiento=?, 
           archivo_nombramiento=?, estatus=?, notas=?
       WHERE id=?`,
      [
        entityIdNum,
        data.bodyType || null,
        data.memberName,
        data.position,
        appointmentDate,
        data.designationInstrument || null,
        data.status || 'Activo',
        data.observations || null,
        data.id
      ]
    )

    return NextResponse.json({ message: "Integrante actualizado" })
  } catch (error: any) {
    console.error("ERROR ACTUALIZANDO INTEGRANTE:", error)
    return NextResponse.json(
      { error: "Error al actualizar integrante", detail: error.message },
      { status: 500 }
    )
  }
}

// ELIMINAR INTEGRANTE
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    await db.query(`DELETE FROM integrantes_organo WHERE id=?`, [id])

    return NextResponse.json({ message: "Integrante eliminado" })
  } catch (error: any) {
    console.error("ERROR ELIMINANDO INTEGRANTE:", error)
    return NextResponse.json(
      { error: "Error al eliminar integrante", detail: error.message },
      { status: 500 }
    )
  }
}