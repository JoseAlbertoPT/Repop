"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { Entity, RegulatoryDocument, GoverningBody, Director, Power, User } from "@/lib/types"
import { mockEntities, mockRegulatoryDocs, mockGoverningBodies, mockDirectors, mockPowers, mockUsers } from "@/lib/data"

interface AppContextType {
  entities: Entity[]
  addEntity: (entity: Omit<Entity, "id" | "folio" | "createdAt">) => Entity
  updateEntity: (id: string, entity: Partial<Entity>) => void
  deleteEntity: (id: string) => void
  getEntity: (id: string) => Entity | undefined

  regulatoryDocs: RegulatoryDocument[]
  addRegulatoryDoc: (doc: Omit<RegulatoryDocument, "id">) => void
  updateRegulatoryDoc: (id: string, doc: Partial<RegulatoryDocument>) => void
  deleteRegulatoryDoc: (id: string) => void

  governingBodies: GoverningBody[]
  addGoverningBody: (body: Omit<GoverningBody, "id">) => void
  updateGoverningBody: (id: string, body: Partial<GoverningBody>) => void
  deleteGoverningBody: (id: string) => void

  directors: Director[]
  addDirector: (director: Omit<Director, "id">) => void
  updateDirector: (id: string, director: Partial<Director>) => void
  deleteDirector: (id: string) => void

  powers: Power[]
  addPower: (power: Omit<Power, "id">) => void
  updatePower: (id: string, power: Partial<Power>) => void
  deletePower: (id: string) => void

  users: User[]
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, user: Partial<User>) => void
  deleteUser: (id: string) => void

  globalFolioCounter: number
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<Entity[]>(mockEntities)
  const [regulatoryDocs, setRegulatoryDocs] = useState<RegulatoryDocument[]>(mockRegulatoryDocs)
  const [governingBodies, setGoverningBodies] = useState<GoverningBody[]>(mockGoverningBodies)
  const [directors, setDirectors] = useState<Director[]>(mockDirectors)
  const [powers, setPowers] = useState<Power[]>(mockPowers)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [globalFolioCounter, setGlobalFolioCounter] = useState<number>(8)

  const generateFolio = (type: "Organismo" | "Fideicomiso" | "EPEM", name: string, consecutiveNumber: number) => {
    const year = new Date().getFullYear()
    let typeCode = "OPD"
    if (type === "Fideicomiso") typeCode = "FI"
    if (type === "EPEM") typeCode = "EPEM"

    const nameAbbr =
      name
        .split(" ")
        .filter((word) => word.length > 2)
        .slice(0, 3)
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "ENT"

    const folioNumber = consecutiveNumber.toString().padStart(2, "0")
    return `SAyF-PF-REPOPA-${nameAbbr}-${typeCode}-${year}-${folioNumber}`
  }

  const addEntity = (entity: Omit<Entity, "id" | "folio" | "createdAt">) => {
    const nextConsecutive = globalFolioCounter + 1
    setGlobalFolioCounter(nextConsecutive)

    const newEntity: Entity = {
      ...entity,
      id: Date.now().toString(),
      folio: generateFolio(entity.type, entity.name, nextConsecutive),
      createdAt: new Date().toISOString().split("T")[0],
    }
    setEntities([...entities, newEntity])
    return newEntity
  }

  const updateEntity = (id: string, entity: Partial<Entity>) => {
    setEntities(entities.map((e) => (e.id === id ? { ...e, ...entity } : e)))
  }

  const deleteEntity = (id: string) => {
    setEntities(entities.filter((e) => e.id !== id))
  }

  const getEntity = (id: string) => {
    return entities.find((e) => e.id === id)
  }

  const addRegulatoryDoc = (doc: Omit<RegulatoryDocument, "id">) => {
    const newDoc: RegulatoryDocument = { ...doc, id: Date.now().toString() }
    setRegulatoryDocs([...regulatoryDocs, newDoc])
  }

  const updateRegulatoryDoc = (id: string, doc: Partial<RegulatoryDocument>) => {
    setRegulatoryDocs(regulatoryDocs.map((d) => (d.id === id ? { ...d, ...doc } : d)))
  }

  const deleteRegulatoryDoc = (id: string) => {
    setRegulatoryDocs(regulatoryDocs.filter((d) => d.id !== id))
  }

  const addGoverningBody = (body: Omit<GoverningBody, "id">) => {
    const newBody: GoverningBody = { ...body, id: Date.now().toString() }
    setGoverningBodies([...governingBodies, newBody])
  }

  const updateGoverningBody = (id: string, body: Partial<GoverningBody>) => {
    setGoverningBodies(governingBodies.map((b) => (b.id === id ? { ...b, ...body } : b)))
  }

  const deleteGoverningBody = (id: string) => {
    setGoverningBodies(governingBodies.filter((b) => b.id !== id))
  }

  const addDirector = (director: Omit<Director, "id">) => {
    const newDirector: Director = { ...director, id: Date.now().toString() }
    setDirectors([...directors, newDirector])
  }

  const updateDirector = (id: string, director: Partial<Director>) => {
    setDirectors(directors.map((d) => (d.id === id ? { ...d, ...director } : d)))
  }

  const deleteDirector = (id: string) => {
    setDirectors(directors.filter((d) => d.id !== id))
  }

  const addPower = (power: Omit<Power, "id">) => {
    const newPower: Power = { ...power, id: Date.now().toString() }
    setPowers([...powers, newPower])
  }

  const updatePower = (id: string, power: Partial<Power>) => {
    setPowers(powers.map((p) => (p.id === id ? { ...p, ...power } : p)))
  }

  const deletePower = (id: string) => {
    setPowers(powers.filter((p) => p.id !== id))
  }

  const addUser = (user: Omit<User, "id">) => {
    const newUser: User = { ...user, id: Date.now().toString() }
    setUsers([...users, newUser])
  }

  const updateUser = (id: string, user: Partial<User>) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, ...user } : u)))
  }

  const deleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id))
  }

  return (
    <AppContext.Provider
      value={{
        entities,
        addEntity,
        updateEntity,
        deleteEntity,
        getEntity,
        regulatoryDocs,
        addRegulatoryDoc,
        updateRegulatoryDoc,
        deleteRegulatoryDoc,
        governingBodies,
        addGoverningBody,
        updateGoverningBody,
        deleteGoverningBody,
        directors,
        addDirector,
        updateDirector,
        deleteDirector,
        powers,
        addPower,
        updatePower,
        deletePower,
        users,
        addUser,
        updateUser,
        deleteUser,
        globalFolioCounter,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
