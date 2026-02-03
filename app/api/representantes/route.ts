import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        id,
        ente_id AS entityId,
        nombre AS name,
        cargo AS position,
        tipo_representacion AS responsibilityType,
        fecha_inicio AS startDate,
        fecha_fin AS endDate,
        documento_soporte AS supportDocument,
        notas AS observations
      FROM representantes
      ORDER BY fecha_inicio DESC
    `)

    return NextResponse.json(rows ?? [])
  } catch (error: any) {
    console.error("ERROR EN /api/representantes:", error.message)
    return NextResponse.json(
      { error: "Error al obtener representantes", detail: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    console.log("Datos recibidos en POST:", data)

    if (!data.entityId || !data.name || !data.position) {
      return NextResponse.json(
        { error: "Ente, nombre y cargo son obligatorios" },
        { status: 400 }
      )
    }

    const entityIdNum = parseInt(data.entityId)
    if (isNaN(entityIdNum)) {
      return NextResponse.json(
        { error: "ID de ente inválido" },
        { status: 400 }
      )
    }

    let startDate: string | null = null
    if (data.startDate && data.startDate !== "") {
      startDate = data.startDate
    }

    let endDate: string | null = null
    if (data.endDate && data.endDate !== "") {
      endDate = data.endDate
    }

    const result = await db.query(
      `INSERT INTO representantes 
        (ente_id, nombre, cargo, tipo_representacion, fecha_inicio, fecha_fin, documento_soporte, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entityIdNum,
        data.name,
        data.position,
        data.responsibilityType || null,
        startDate,
        endDate,
        data.supportDocument || null,
        data.observations || null
      ]
    )

    console.log("Resultado de INSERT:", result)

    return NextResponse.json({ 
      message: "Representante creado correctamente",
      id: (result as any).insertId 
    })
  } catch (error: any) {
    console.error("ERROR CREANDO REPRESENTANTE:", error)
    return NextResponse.json(
      { error: "Error al crear representante", detail: error.message },
      { status: 500 }
    )
  }
}

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

    let startDate: string | null = null
    if (data.startDate && data.startDate !== "") {
      startDate = data.startDate
    }

    let endDate: string | null = null
    if (data.endDate && data.endDate !== "") {
      endDate = data.endDate
    }

    await db.query(
      `UPDATE representantes 
       SET ente_id=?, nombre=?, cargo=?, tipo_representacion=?, 
           fecha_inicio=?, fecha_fin=?, documento_soporte=?, notas=?
       WHERE id=?`,
      [
        entityIdNum,
        data.name,
        data.position,
        data.responsibilityType || null,
        startDate,
        endDate,
        data.supportDocument || null,
        data.observations || null,
        data.id
      ]
    )

    return NextResponse.json({ message: "Representante actualizado" })
  } catch (error: any) {
    console.error("ERROR ACTUALIZANDO REPRESENTANTE:", error)
    return NextResponse.json(
      { error: "Error al actualizar representante", detail: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    await db.query(`DELETE FROM representantes WHERE id=?`, [id])

    return NextResponse.json({ message: "Representante eliminado" })
  } catch (error: any) {
    console.error("ERROR ELIMINANDO REPRESENTANTE:", error)
    return NextResponse.json(
      { error: "Error al eliminar representante", detail: error.message },
      { status: 500 }
    )
  }
}