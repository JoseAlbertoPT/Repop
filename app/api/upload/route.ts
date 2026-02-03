import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public/uploads")
    await mkdir(uploadDir, { recursive: true })

    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`
    const filePath = path.join(uploadDir, uniqueName)

    await writeFile(filePath, buffer)

    return NextResponse.json({
      url: `/uploads/${uniqueName}`,
    })
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error)

    return NextResponse.json(
      { error: "Upload failed", detail: error.message },
      { status: 500 }
    )
  }
}
