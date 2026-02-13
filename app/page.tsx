"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null)

  const validatePassword = (pass: string) => {
    if (pass.length === 0) {
      setPasswordValid(null)
      return
    }
    const isValid = pass.length >= 6
    setPasswordValid(isValid)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    validatePassword(newPassword)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      sessionStorage.setItem("currentUser", JSON.stringify(data))
      sessionStorage.setItem("jwtToken", data.token)

      router.push("/dashboard")

    } catch (err) {
      console.error(err)
      setError("No se pudo conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Panel Izquierdo - Imagen REPOPA de fondo */}
      <div className="hidden lg:flex lg:w-[42%] relative bg-[#3d5043] items-center justify-center overflow-hidden">
        <div className="relative w-full h-full pb-53">
          <Image 
            src="/images/logo-repopa.jpg"
            alt="REPOPA - Registro Público de Organismos Públicos Auxiliares"
            fill
            className="object-contain"
            priority
            quality={100}
          />
        </div>
      </div>

      {/* Panel Derecho - Formulario con fondo verde oscuro */}
      <div className="w-full lg:w-[58%] flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-gradient-to-br from-[#2a3a2e] via-[#3d5043] to-[#2a3a2e] relative overflow-hidden">
        {/* Estrellas brillantes verdes en el fondo */}
        <div className="absolute top-16 right-40 text-[#7a8c7a] animate-sparkle-bright text-2xl drop-shadow-glow" style={{ animationDelay: '0s' }}>✦</div>
        <div className="absolute bottom-40 left-32 text-[#8b9d8a] animate-sparkle-bright text-xl drop-shadow-glow" style={{ animationDelay: '1.5s' }}>✦</div>
        <div className="absolute top-1/2 right-24 text-[#9db09c] animate-sparkle-bright text-2xl drop-shadow-glow" style={{ animationDelay: '2.5s' }}>✦</div>
        <div className="absolute top-32 left-1/4 text-[#6a7c6a] animate-sparkle-bright text-xl drop-shadow-glow" style={{ animationDelay: '3.5s' }}>✦</div>
        <div className="absolute bottom-24 right-1/3 text-[#7a8c7a] animate-sparkle-bright text-2xl drop-shadow-glow" style={{ animationDelay: '1s' }}>✦</div>
        <div className="absolute top-1/4 left-20 text-[#8b9d8a] animate-sparkle-bright text-lg drop-shadow-glow" style={{ animationDelay: '2s' }}>✦</div>
        <div className="absolute bottom-1/3 right-40 text-[#9db09c] animate-sparkle-bright text-2xl drop-shadow-glow" style={{ animationDelay: '3s' }}>✦</div>
        
        {/* Puntos brillantes verdes flotantes */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-[#7a8c7a] rounded-full animate-glow shadow-glow-sm" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-20 right-20 w-2 h-2 bg-[#8b9d8a] rounded-full animate-glow shadow-glow-md" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-[#9db09c] rounded-full animate-glow shadow-glow-sm" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        <div className="absolute top-40 right-32 w-2.5 h-2.5 bg-[#6a7c6a] rounded-full animate-glow shadow-glow-lg" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
        <div className="absolute bottom-20 right-16 w-2 h-2 bg-[#7a8c7a] rounded-full animate-glow shadow-glow-md" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }} />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-[#8b9d8a] rounded-full animate-glow shadow-glow-sm" style={{ animationDelay: '2.5s', animationDuration: '3.8s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-[#6a7c6a] rounded-full animate-glow shadow-glow-lg" style={{ animationDelay: '1.8s', animationDuration: '4.2s' }} />
        <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-[#9db09c] rounded-full animate-glow shadow-glow-md" style={{ animationDelay: '3s', animationDuration: '4.8s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#7a8c7a] rounded-full animate-glow shadow-glow-sm" style={{ animationDelay: '2.2s', animationDuration: '3.6s' }} />
        <div className="absolute top-60 left-40 w-2.5 h-2.5 bg-[#8b9d8a] rounded-full animate-glow shadow-glow-lg" style={{ animationDelay: '1.2s', animationDuration: '4.4s' }} />
        <div className="absolute bottom-48 right-48 w-1.5 h-1.5 bg-[#6a7c6a] rounded-full animate-glow shadow-glow-md" style={{ animationDelay: '2.8s', animationDuration: '3.2s' }} />
        <div className="absolute top-1/2 left-20 w-2 h-2 bg-[#9db09c] rounded-full animate-glow shadow-glow-sm" style={{ animationDelay: '0.8s', animationDuration: '4.6s' }} />
        <div className="absolute bottom-1/2 right-40 w-2 h-2 bg-[#7a8c7a] rounded-full animate-glow shadow-glow-lg" style={{ animationDelay: '2.3s', animationDuration: '3.9s' }} />
        <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-[#8b9d8a] rounded-full animate-glow shadow-glow-md" style={{ animationDelay: '1.7s', animationDuration: '4.1s' }} />
        <div className="absolute bottom-16 left-24 w-2.5 h-2.5 bg-[#6a7c6a] rounded-full animate-glow shadow-glow-lg" style={{ animationDelay: '3.2s', animationDuration: '3.4s' }} />
        
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/98 backdrop-blur-md relative z-10 overflow-hidden rounded-3xl">
          {/* Borde brillante sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7a8c7a]/5 via-transparent to-[#7a8c7a]/5 pointer-events-none" />
          
          <CardContent className="p-10 sm:p-12 lg:p-14 space-y-6 relative">
            {/* Logo y Títulos */}
            <div className="flex flex-col items-center mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
              {/* Logo circular con estrellas decorativas */}
              <div className="relative mb-6">
                <div className="absolute -top-2 -right-2 text-[#7a8c7a]/40 animate-sparkle text-sm" style={{ animationDelay: '0s' }}>✦</div>
                <div className="absolute -bottom-1 -left-1 text-[#8b9d8a]/30 animate-sparkle text-xs" style={{ animationDelay: '1s' }}>✦</div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6a7c6a] to-[#5a6c5a] flex items-center justify-center shadow-xl transform hover:scale-105 transition-all duration-300 border-4 border-white/50">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
              
              {/* Título REPOPA */}
              <h1 className="text-3xl font-black text-[#2a3a2e] tracking-wider mb-2">REPOPA</h1>
              
              {/* Subtítulo */}
              <p className="text-xs text-[#3d5043] text-center px-4 leading-relaxed mb-3 font-medium">
                Registro Público de Organismos<br />Públicos Auxiliares
              </p>
              
              {/* Divisor con iconos */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-px w-12 bg-[#7a8c7a]/30"></div>
                <Shield className="w-3 h-3 text-[#7a8c7a]/60" />
                <div className="text-[10px] text-[#5a6c5a] font-semibold tracking-wider">Procuraduría Fiscal</div>
                <Shield className="w-3 h-3 text-[#7a8c7a]/60" />
                <div className="h-px w-12 bg-[#7a8c7a]/30"></div>
              </div>
              
              {/* Badge del Gobierno */}
              <div className="flex items-center gap-2 bg-[#7a8c7a]/10 backdrop-blur-sm px-4 py-2 rounded-full border border-[#7a8c7a]/20 shadow-lg">
                <span className="text-[10px] text-[#3d5043] font-semibold tracking-wide">Gobierno del Estado de Morelos</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-400 bg-red-500/90 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl">
                  <AlertCircle className="h-5 w-5 text-white" />
                  <AlertDescription className="font-medium text-sm ml-2 text-white">{error}</AlertDescription>
                </Alert>
              )}

              {/* Campo de Correo Electrónico */}
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-2 pl-1">
                  <Mail className="w-4 h-4 text-[#5a6c5a]" />
                  <Label htmlFor="email" className="text-xs font-semibold text-[#3d5043] tracking-wide">
                    Correo Electrónico
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@morelos.gob.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 pr-4 bg-white border-2 border-[#e5e5e5] focus:border-[#7a8c7a] focus:bg-white rounded-xl transition-all duration-300 text-sm font-medium placeholder:text-gray-400 shadow-lg focus:shadow-xl text-gray-700 focus:ring-2 focus:ring-[#7a8c7a]/20"
                    required
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Campo de Contraseña */}
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2 pl-1">
                  <Lock className="w-4 h-4 text-[#5a6c5a]" />
                  <Label htmlFor="password" className="text-xs font-semibold text-[#3d5043] tracking-wide">
                    Contraseña
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`h-12 pl-11 pr-12 bg-white border-2 ${
                      passwordValid === null 
                        ? 'border-[#e5e5e5] focus:border-[#7a8c7a]' 
                        : passwordValid 
                        ? 'border-green-400 bg-green-50 focus:border-green-500' 
                        : 'border-red-400 bg-red-50 focus:border-red-500'
                    } rounded-xl transition-all duration-300 text-sm font-medium placeholder:text-gray-400 shadow-lg focus:shadow-xl text-gray-700 focus:ring-2 ${
                      passwordValid === null 
                        ? 'focus:ring-[#7a8c7a]/20' 
                        : passwordValid 
                        ? 'focus:ring-green-400/20' 
                        : 'focus:ring-red-400/20'
                    }`}
                    required
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                    passwordValid === null 
                      ? 'text-gray-400' 
                      : passwordValid 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Mensaje de validación */}
                {password.length > 0 && password.length < 6 && (
                  <p className="text-[10px] text-red-500 pl-1 animate-in fade-in slide-in-from-top-1 duration-200 font-medium">
                    ⚠ La contraseña debe tener al menos 6 caracteres
                  </p>
                )}
                {passwordValid && (
                  <p className="text-[10px] text-green-600 pl-1 animate-in fade-in slide-in-from-top-1 duration-200 font-medium">
                    ✓ Contraseña válida
                  </p>
                )}
              </div>

              {/* Botón de login */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2" style={{ animationDelay: '300ms' }}>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-[#5a6c5a] to-[#4a5c4a] hover:from-[#4a5c4a] hover:to-[#3a4c3a] text-white font-bold text-sm tracking-widest rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] uppercase flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>INGRESANDO...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>INICIAR SESIÓN</span>
                      <span className="text-lg">→</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Indicador de conexión segura */}
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-center gap-2 bg-[#7a8c7a]/10 backdrop-blur-sm px-4 py-2.5 rounded-full border border-[#7a8c7a]/20">
                <Shield className="w-3.5 h-3.5 text-[#5a6c5a]" />
                <span className="text-[10px] text-[#3d5043] font-semibold tracking-wider">Sitio Seguro</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes glow {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.4;
            box-shadow: 0 0 8px currentColor, 0 0 16px currentColor, 0 0 24px currentColor;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 0.8;
            box-shadow: 0 0 16px currentColor, 0 0 32px currentColor, 0 0 48px currentColor;
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.9) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
        }
        
        @keyframes sparkle-bright {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8) rotate(0deg);
            filter: drop-shadow(0 0 4px currentColor) drop-shadow(0 0 8px currentColor);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.2) rotate(180deg);
            filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor);
          }
        }
        
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        
        .animate-sparkle-bright {
          animation: sparkle-bright 2.5s ease-in-out infinite;
        }
        
        .shadow-glow-sm {
          box-shadow: 0 0 8px #7a8c7a, 0 0 16px #7a8c7a;
        }
        
        .shadow-glow-md {
          box-shadow: 0 0 12px #8b9d8a, 0 0 24px #8b9d8a;
        }
        
        .shadow-glow-lg {
          box-shadow: 0 0 16px #6a7c6a, 0 0 32px #6a7c6a;
        }
        
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor);
        }
      `}</style>
    </div>
  )
}