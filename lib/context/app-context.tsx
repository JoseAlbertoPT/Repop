"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { User, UserRole } from "@/lib/types"


export interface Entity {
  id: string
  name: string
}

export interface RegulatoryDoc {
  id: string
  entityId: string
  entityName: string
  type: string
  issueDate: string
  fileName?: string
  notes?: string
}



interface AppContextType {
  entities: Entity[]
  regulatoryDocs: RegulatoryDoc[]
  addRegulatoryDoc: (doc: Omit<RegulatoryDoc, "id">) => void
  updateRegulatoryDoc: (id: string, doc: Partial<RegulatoryDoc>) => void
  deleteRegulatoryDoc: (id: string) => void

  users: User[]
  addUser: (data: any) => Promise<void>
  updateUser: (id: number, data: any) => Promise<void>
  deleteUser: (id: number) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [entities, setEntities] = useState<Entity[]>([])
  const [regulatoryDocs, setRegulatoryDocs] = useState<RegulatoryDoc[]>([])
  const [users, setUsers] = useState<User[]>([])


  useEffect(() => {
    setEntities([
      { id: "1", name: "IMIPE" },
      { id: "2", name: "DIF Morelos" },
      { id: "3", name: "IEBEM" },
      { id: "4", name: "SSM" },
    ])
  }, [])


  const addRegulatoryDoc = (doc: Omit<RegulatoryDoc, "id">) => {
    setRegulatoryDocs(prev => [...prev, { ...doc, id: crypto.randomUUID() }])
  }

  const updateRegulatoryDoc = (id: string, doc: Partial<RegulatoryDoc>) => {
    setRegulatoryDocs(prev =>
      prev.map(d => (d.id === id ? { ...d, ...doc } : d))
    )
  }

  const deleteRegulatoryDoc = (id: string) => {
    setRegulatoryDocs(prev => prev.filter(d => d.id !== id))
  }


  const loadUsers = async () => {
    try {
      const res = await fetch("/api/usuarios")
      if (!res.ok) {
        console.error("Error al cargar usuarios:", res.statusText)
        return
      }
      const data = await res.json()
      console.log("Usuarios cargados:", data) // Para debug
      setUsers(data)
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const addUser = async (data: any) => {
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al crear usuario")
      await loadUsers()
    } catch (error) {
      console.error("Error al agregar usuario:", error)
      throw error
    }
  }

  const updateUser = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al actualizar usuario")
      await loadUsers()
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      throw error
    }
  }

  const deleteUser = async (id: number) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar usuario")
      await loadUsers()
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      throw error
    }
  }

  return (
    <AppContext.Provider
      value={{
        entities,
        regulatoryDocs,
        addRegulatoryDoc,
        updateRegulatoryDoc,
        deleteRegulatoryDoc,
        users,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider")
  return ctx
}