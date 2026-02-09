"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/lib/types"

interface AuthContextType {
  currentUser: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  isLoading: boolean
}

// Context seguro (no undefined)
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedUser = localStorage.getItem("currentUser")
    const storedToken = localStorage.getItem("jwtToken")

    if (storedUser && storedToken) {
      try {
        setCurrentUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("currentUser")
        localStorage.removeItem("jwtToken")
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading && !currentUser && pathname?.startsWith("/dashboard")) {
      router.push("/login")
    }
  }, [currentUser, isLoading, pathname, router])

  const login = (user: User, authToken: string) => {
    setCurrentUser(user)
    setToken(authToken)

    localStorage.setItem("currentUser", JSON.stringify(user))
    localStorage.setItem("jwtToken", authToken)

    router.push("/dashboard")
  }

  const logout = () => {
    setCurrentUser(null)
    setToken(null)

    localStorage.removeItem("currentUser")
    localStorage.removeItem("jwtToken")

    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    return {
      currentUser: null,
      token: null,
      login: () => {},
      logout: () => {},
      isLoading: true,
    }
  }

  return context
}
