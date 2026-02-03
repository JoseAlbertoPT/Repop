"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/lib/types"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { AppProvider } from "@/lib/context/app-context"
import { Button } from "@/components/ui/button"
import {
  Building2,
  FileText,
  Users,
  UserCog,
  Award,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

const navigation = [
  { name: "Panel Principal", href: "/dashboard", icon: BarChart3, roles: ["ADMIN", "CAPTURISTA", "CONSULTA"] },
  { name: "Identificación de Entes", href: "/dashboard/entities", icon: Building2, roles: ["ADMIN", "CAPTURISTA", "CONSULTA"] },
  { name: "Marco Normativo", href: "/dashboard/regulatory", icon: FileText, roles: ["ADMIN", "CAPTURISTA", "CONSULTA"] },
  { name: "Integrantes", href: "/dashboard/governing-bodies", icon: Users, roles: ["ADMIN", "CAPTURISTA", "CONSULTA"] },
  { name: "Dirección y Representación", href: "/dashboard/directors", icon: UserCog, roles: ["ADMIN", "CAPTURISTA", "CONSULTA"] },
  { name: "Poderes y Facultades", href: "/dashboard/powers", icon: Award, roles: ["ADMIN", "CAPTURISTA", "CONSULTA"] },
  { name: "Reportes", href: "/dashboard/reports", icon: BarChart3, roles: ["ADMIN", "CAPTURISTA", "CONSULTA"] },
  { name: "Gestión de Usuarios", href: "/dashboard/users", icon: Settings, roles: ["ADMIN"] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser")
    if (!userStr) {
      router.push("/")
    } else {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser")
    router.push("/")
  }

  if (!currentUser) return null

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(currentUser.role)
  )

  return (
    <ThemeProvider defaultTheme="light">
      <AppProvider>
        <div className="min-h-screen bg-background">
          {/* SIDEBAR */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <div className="flex flex-col flex-grow border-r border-border bg-card overflow-y-auto">
              <div className="flex items-center justify-center p-6 border-b border-border">
                <Image
                  src="/images/logo-20finanzas.png"
                  alt="Secretaría de Finanzas"
                  width={220}
                  height={66}
                  className="w-auto h-14"
                  priority
                />
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="lg:pl-64">
            <div className="flex justify-end p-4 border-b">
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser.role}
                  </p>
                </div>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <main className="p-6">{children}</main>
          </div>
        </div>
      </AppProvider>
    </ThemeProvider>
  )
}
