import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  const [rows] = await db.query(`
    SELECT 
      u.id,
      u.nombre_completo AS name,
      u.correo AS email,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.activo = 1
  `)

  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json()

  const [roles]: any = await db.query(
    "SELECT id FROM roles WHERE nombre = ?",
    [role]
  )

  const hash = await bcrypt.hash(password, 10)

  await db.query(
    `INSERT INTO usuarios (nombre_completo, correo, password_hash, rol_id)
     VALUES (?, ?, ?, ?)`,
    [name, email, hash, roles[0].id]
  )

  return NextResponse.json({ ok: true })
}
