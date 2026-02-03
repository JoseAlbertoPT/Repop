import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    console.log(" Iniciando GET /api/poderes")

    const [testQuery]: any = await db.query("SELECT 1 as test")
    console.log(" Conexión DB OK:", testQuery)

    const [poderes]: any = await db.query(`
      SELECT * FROM poderes
      ORDER BY created_at DESC
    `)
    console.log(" Poderes obtenidos:", poderes.length)

    for (const poder of poderes) {
      try {
        const [apoderados]: any = await db.query(
          "SELECT nombre FROM apoderados WHERE poder_id = ?",
          [poder.id]
        )
        console.log(` Apoderados para poder ${poder.id}:`, apoderados.length)
        
        poder.attorneys = apoderados.map((a: any) => a.nombre)
      } catch (error) {
        console.error(` Error obteniendo apoderados para poder ${poder.id}:`, error)
        poder.attorneys = []
      }
    }

    const poderesFormateados = poderes.map((p: any) => ({
      id: p.id,
      entityId: p.ente_id,
      powerType: p.tipo_poder,
      attorneys: p.attorneys || [],
      grantDate: p.fecha_nombramiento,
      revocationDate: p.fecha_revocacion,
      document: p.referencia_documento,
      fileUrl: p.documento_archivo ? `/uploads/poderes/${p.documento_archivo}` : null,
      notes: p.notas
    }))

    console.log(" Respuesta formateada:", poderesFormateados.length, "poderes")
    
    return NextResponse.json(poderesFormateados)

  } catch (error: any) {
    console.error(" ERROR EN GET /api/poderes:", error)
    console.error("Tipo de error:", error.constructor.name)
    console.error("Mensaje:", error.message)
    console.error("Stack:", error.stack)
    
    return NextResponse.json(
      { 
        error: "Error al obtener poderes",
        message: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log(" POST - Body recibido:", JSON.stringify(body, null, 2))

    const { entityId, powerType, attorneys, grantDate, document, fileUrl } = body

    if (!entityId) {
      return NextResponse.json({ error: "entityId es requerido" }, { status: 400 })
    }
    if (!powerType) {
      return NextResponse.json({ error: "powerType es requerido" }, { status: 400 })
    }
    if (!attorneys || !Array.isArray(attorneys) || attorneys.length === 0) {
      return NextResponse.json({ error: "attorneys debe ser un array con al menos un elemento" }, { status: 400 })
    }

    console.log(" Validación pasada")
    console.log("  - entityId:", entityId, typeof entityId)
    console.log("  - powerType:", powerType)
    console.log("  - attorneys:", attorneys)

    const [result]: any = await db.query(
      `INSERT INTO poderes (ente_id, tipo_poder, fecha_nombramiento, referencia_documento)
       VALUES (?, ?, ?, ?)`,
      [
        parseInt(entityId),
        powerType,
        grantDate || null,
        document || null
      ]
    )

    const poderId = result.insertId
    console.log(" Poder insertado con ID:", poderId)

    for (const nombre of attorneys) {
      if (nombre && nombre.trim()) {
        console.log(`  Insertando apoderado: "${nombre}" para poder_id: ${poderId}`)
        await db.query(
          "INSERT INTO apoderados (poder_id, nombre) VALUES (?, ?)",
          [poderId, nombre.trim()]
        )
      }
    }

    console.log(" Apoderados insertados:", attorneys.length)

    return NextResponse.json({ 
      success: true,
      id: poderId,
      message: "Poder creado exitosamente"
    })

  } catch (error: any) {
    console.error(" ERROR EN POST /api/poderes:", error)
    console.error("Mensaje:", error.message)
    console.error("SQL State:", error.sqlState)
    console.error("SQL Message:", error.sqlMessage)
    
    return NextResponse.json(
      { 
        error: "Error al crear poder",
        message: error.message,
        sqlMessage: error.sqlMessage
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    console.log(" PUT - Body recibido:", JSON.stringify(body, null, 2))

    const { id, entityId, powerType, attorneys, grantDate, document } = body

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 })
    }

    // Actualizar el poder
    await db.query(
      `UPDATE poderes 
       SET ente_id = ?, tipo_poder = ?, fecha_nombramiento = ?, referencia_documento = ?
       WHERE id = ?`,
      [parseInt(entityId), powerType, grantDate || null, document || null, id]
    )

    console.log("Poder actualizado:", id)

    await db.query("DELETE FROM apoderados WHERE poder_id = ?", [id])
    console.log(" Apoderados anteriores eliminados")

    for (const nombre of attorneys) {
      if (nombre && nombre.trim()) {
        await db.query(
          "INSERT INTO apoderados (poder_id, nombre) VALUES (?, ?)",
          [id, nombre.trim()]
        )
      }
    }

    console.log(" Nuevos apoderados insertados:", attorneys.length)

    return NextResponse.json({ 
      success: true,
      message: "Poder actualizado exitosamente"
    })

  } catch (error: any) {
    console.error(" ERROR EN PUT:", error)
    return NextResponse.json(
      { 
        error: "Error al actualizar poder",
        message: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 })
    }

    console.log(" Eliminando poder:", id)

    await db.query("DELETE FROM poderes WHERE id = ?", [id])

    console.log("Poder eliminado:", id)

    return NextResponse.json({ 
      success: true,
      message: "Poder eliminado exitosamente"
    })

  } catch (error: any) {
    console.error(" ERROR EN DELETE:", error)
    return NextResponse.json(
      { 
        error: "Error al eliminar poder",
        message: error.message
      },
      { status: 500 }
    )
  }
}