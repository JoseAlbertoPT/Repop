export const handleFileUpload = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Store file as base64 with metadata
      const base64 = reader.result as string
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
      }
      // Return JSON string that can be stored
      resolve(JSON.stringify(fileData))
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const getFileInfo = (fileString: string): { name: string; type: string; size: number; data: string } | null => {
  try {
    return JSON.parse(fileString)
  } catch {
    // Legacy format - just filename
    return { name: fileString, type: "", size: 0, data: "" }
  }
}

export const downloadFile = (fileString: string) => {
  const fileInfo = getFileInfo(fileString)
  if (!fileInfo || !fileInfo.data) {
    alert("Archivo no disponible")
    return
  }

  const link = document.createElement("a")
  link.href = fileInfo.data
  link.download = fileInfo.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
