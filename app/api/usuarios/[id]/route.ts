import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { name, email, password, role } = await req.json()

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Nombre, email y rol son requeridos" },
        { status: 400 }
      )
    }

    const [roles]: any = await db.query(
      "SELECT id FROM roles WHERE nombre = ?",
      [role]
    )

    if (roles.length === 0) {
      return NextResponse.json(
        { error: "Rol no válido" },
        { status: 400 }
      )
    }

    let query = `
      UPDATE usuarios
      SET nombre_completo = ?, correo = ?, rol_id = ?
    `
    const values: any[] = [name, email, roles[0].id]

    if (password && password.trim() !== "") {
      const hash = await bcrypt.hash(password, 10)
      query += `, password_hash = ?`
      values.push(hash)
    }

    query += ` WHERE id = ?`
    values.push(id)

    const [result]: any = await db.query(query, values)

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      ok: true,
      message: "Usuario actualizado exitosamente" 
    })
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const [result]: any = await db.query(
      "UPDATE usuarios SET activo = 0 WHERE id = ?",
      [id]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      ok: true,
      message: "Usuario eliminado exitosamente" 
    })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}