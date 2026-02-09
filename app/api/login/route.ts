import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cambiame_a_una_clave_segura";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    // Buscar usuario activo por correo
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE correo = ? AND activo = TRUE",
      [email]
    );

    const usuarios = rows as any[];

    if (usuarios.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      );
    }

    const user = usuarios[0];

    // Comparar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Obtener rol REAL desde la BD
    const [rolesRows] = await db.query(
      "SELECT nombre FROM roles WHERE id = ?",
      [user.rol_id]
    );

    const roles = rolesRows as any[];
    const rolBD = roles[0]?.nombre || "CONSULTA";

    const rolFrontend = rolBD;

    // Payload del token y de la sesión
    const payload = {
      id: user.id,
      name: user.nombre_completo,
      email: user.correo,
      role: rolFrontend,
    };

    // Generar JWT válido por 1 hora
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    return NextResponse.json({
      ...payload,
      token,
    });
  } catch (error) {
    console.error("Error login:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}