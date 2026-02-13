"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertCircle, Mail, Lock, Sparkles, Eye, EyeOff, ChevronRight, Fingerprint } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHoveringCard, setIsHoveringCard] = useState(false)

  // Partículas optimizadas
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: 40 + (i * 5) % 120,
      left: (i * 11) % 100,
      top: (i * 13) % 100,
      delay: (i * 0.2) % 5,
      duration: 12 + (i * 1.5) % 15,
      opacity: 0.15 + (i % 3) * 0.05,
    }))
  }, [])

  // Estrellas de fondo
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: (i * 19) % 100,
      top: (i * 23) % 100,
      size: 1 + (i % 3),
      delay: (i * 0.1) % 3,
    }))
  }, [])

  useEffect(() => {
    setMounted(true)
    
    // Limpiar sesión anterior al cargar la página de login
    sessionStorage.removeItem("currentUser")
    sessionStorage.removeItem("jwtToken")
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("Intentando login con:", email)

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ email, password }),
      })

      console.log("Respuesta del servidor:", res.status)

      const data = await res.json()
      console.log("Datos recibidos:", data)

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      // Validar que tenemos los datos necesarios
      if (!data.id || !data.role) {
        console.error("Datos incompletos del usuario:", data)
        setError("Error en la respuesta del servidor")
        setLoading(false)
        return
      }

      console.log("Usuario autenticado:", data)

      // Guardar en sessionStorage
      sessionStorage.setItem("currentUser", JSON.stringify(data))
      sessionStorage.setItem("jwtToken", data.token)

      console.log("Datos guardados en sessionStorage")
      console.log("Redirigiendo a dashboard...")

      // Redirigir al dashboard
      router.push("/dashboard")
      router.refresh()

    } catch (err) {
      console.error("Error en login:", err)
      setError("No se pudo conectar con el servidor")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-end p-4 overflow-hidden">
      {/* Imagen de fondo en el lado izquierdo */}
      <div className="absolute inset-y-0 left-0 w-full lg:w-[calc(50%-2px)]">
        <div className="relative h-full w-full">
          {/* Imagen */}
          <img 
            src="/images/logo-repopa.jpg" 
            alt="REPOPA Background" 
            className="h-full w-full object-cover object-center"
          />
          {/* Overlay sutil para mezclar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f1810]/80 lg:to-[#0f1810]" />
        </div>
      </div>

      {/* Fondo base con gradiente animado - solo lado derecho */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[calc(50%+2px)] bg-gradient-to-br from-[#0f1810] via-[#1a2318] to-[#2a1810]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(113,120,91,0.15),transparent_50%)] animate-pulse-subtle" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#7C4A36]/10 via-transparent to-[#71785b]/10 animate-gradient-rotate" />
      </div>

      {/* Estrellas titilantes - solo lado derecho */}
      {mounted && (
        <div className="absolute inset-y-0 right-0 w-full lg:w-[calc(50%+2px)]">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white animate-twinkle-star"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Partículas flotantes mejoradas - solo lado derecho */}
      {mounted && (
        <div className="absolute inset-y-0 right-0 w-full lg:w-[calc(50%+2px)]">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full backdrop-blur-sm animate-float-3d"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                background: `radial-gradient(circle, rgba(255,255,255,${particle.opacity}) 0%, transparent 70%)`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Luces ambientales dinámicas - solo lado derecho */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-float-ambient" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#7C4A36]/5 rounded-full blur-[120px] animate-float-ambient-delayed" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-white/3 rounded-full blur-[150px] animate-pulse-glow" />

      {/* Rejilla 3D mejorada - solo lado derecho */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[calc(50%+2px)] bg-[linear-gradient(rgba(255,255,255,.04)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,.04)_1.5px,transparent_1.5px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_20%,transparent_80%)] animate-grid-move" />

      {/* Card principal COMPACTO - Posicionado más a la derecha */}
      <Card 
        className="w-full max-w-[420px] relative shadow-[0_0_80px_rgba(0,0,0,0.3)] border-0 bg-gradient-to-br from-white/[0.98] via-white/[0.95] to-white/[0.92] backdrop-blur-3xl animate-card-entrance overflow-hidden group lg:mr-24 z-20"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHoveringCard(true)}
        onMouseLeave={() => setIsHoveringCard(false)}
      >
        {/* Efecto de luz siguiendo el cursor */}
        {isHoveringCard && (
          <div
            className="absolute w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
              background: 'radial-gradient(circle, rgba(113,120,91,0.15) 0%, transparent 70%)',
              opacity: 0.6,
            }}
          />
        )}

        {/* Bordes brillantes animados */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute -top-px left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer-fast" />
          <div className="absolute -bottom-px left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7C4A36] to-transparent animate-shimmer-fast-delayed" />
          <div className="absolute top-0 -left-px bottom-0 w-[2px] bg-gradient-to-b from-transparent via-primary/50 to-transparent animate-shimmer-vertical" />
          <div className="absolute top-0 -right-px bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#7C4A36]/50 to-transparent animate-shimmer-vertical-delayed" />
        </div>
        
        {/* Resplandor interno animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-[#7C4A36]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <CardHeader className="space-y-4 text-center relative z-10 pt-6 pb-4">
          {/* Icono compacto */}
          <div className="relative mx-auto w-20 h-20 group/icon">
            {/* Anillos pulsantes */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-md animate-pulse-ring-1" />
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/15 via-primary/30 to-primary/15 blur-sm animate-pulse-ring-2" />
            
            {/* Círculo principal */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary/95 to-primary/80 shadow-[0_15px_40px_rgba(113,120,91,0.4)] transition-all duration-700 group-hover/icon:scale-110 group-hover/icon:rotate-[360deg]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 via-transparent to-transparent opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-10 h-10 text-white animate-shield-breathe drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
            
            {/* Partículas orbitantes */}
            <Sparkles className="absolute -top-3 -right-3 w-5 h-5 text-primary/80 animate-orbit-1" />
            <Sparkles className="absolute -bottom-2 -left-3 w-4 h-4 text-primary/60 animate-orbit-2" />
            <Fingerprint className="absolute -bottom-3 -right-2 w-4 h-4 text-[#7C4A36]/70 animate-orbit-4" />
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500 animate-rotate-shine" />
          </div>

          <div className="space-y-3">
            {/* Título compacto */}
            <div className="relative inline-block">
              <CardTitle className="text-4xl font-black bg-gradient-to-r from-[#2E3B2B] via-[#4a5a3d] to-[#7C4A36] bg-clip-text text-transparent animate-text-shimmer-slow bg-[length:300%_auto]">
                REPOPA
              </CardTitle>
            </div>
            
            <CardDescription className="text-sm leading-relaxed font-semibold text-gray-700">
              Registro Público de Organismos<br />Públicos Auxiliares
            </CardDescription>
            
            {/* Separador compacto */}
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-primary/60 to-primary rounded-full animate-pulse-width" />
              <Shield className="w-3 h-3 text-primary animate-bounce-gentle" />
              <span className="font-bold text-xs bg-gradient-to-r from-primary to-[#7C4A36] bg-clip-text text-transparent">
                Procuraduría Fiscal
              </span>
              <Shield className="w-3 h-3 text-primary animate-bounce-gentle" style={{ animationDelay: '0.2s' }} />
              <div className="h-[2px] w-16 bg-gradient-to-l from-transparent via-[#7C4A36]/60 to-[#7C4A36] rounded-full animate-pulse-width" style={{ animationDelay: '0.5s' }} />
            </div>
            
            {/* Badge compacto */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-[#7C4A36]/10 border border-primary/20 shadow-md shadow-primary/10 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <p className="text-[11px] font-bold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
                Gobierno del Estado de Morelos
              </p>
              <Sparkles className="w-2.5 h-2.5 text-primary/60 animate-spin-slow" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 relative z-10 pb-6 px-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-shake-intense border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 shadow-lg shadow-red-200/50">
                <AlertCircle className="h-4 w-4 animate-pulse" />
                <AlertDescription className="font-semibold text-sm text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Campo de email COMPACTO */}
            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className={`transition-all duration-300 font-bold text-xs flex items-center gap-1.5 ${
                  focusedField === 'email' ? 'text-primary scale-105' : 'text-gray-700'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Correo Electrónico
              </Label>
              <div className="relative group/input">
                <div className={`absolute -inset-1 bg-gradient-to-r from-primary via-primary/60 to-primary rounded-lg blur-lg opacity-0 group-focus-within/input:opacity-40 transition-all duration-500`} />
                
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/50 via-transparent to-primary/50 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 p-[2px]">
                  <div className="w-full h-full bg-white rounded-[7px]" />
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      focusedField === 'email' 
                        ? 'bg-primary/10 scale-110' 
                        : 'bg-gray-100'
                    }`}>
                      <Mail className={`w-3.5 h-3.5 transition-all duration-300 ${
                        focusedField === 'email' ? 'text-primary' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="w-px h-5 bg-gray-200" />
                  </div>
                  
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@morelos.gob.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-16 pr-3 h-11 text-sm transition-all duration-300 focus:ring-0 border-2 border-gray-200 focus:border-primary bg-white hover:bg-gray-50 focus:bg-white rounded-lg font-medium"
                    required
                    disabled={loading}
                  />
                  
                  {email && email.includes('@') && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Campo de contraseña COMPACTO */}
            <div className="space-y-2">
              <Label 
                htmlFor="password"
                className={`transition-all duration-300 font-bold text-xs flex items-center gap-1.5 ${
                  focusedField === 'password' ? 'text-primary scale-105' : 'text-gray-700'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Contraseña
              </Label>
              <div className="relative group/input">
                <div className={`absolute -inset-1 bg-gradient-to-r from-primary via-primary/60 to-primary rounded-lg blur-lg opacity-0 group-focus-within/input:opacity-40 transition-all duration-500`} />
                
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/50 via-transparent to-primary/50 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 p-[2px]">
                  <div className="w-full h-full bg-white rounded-[7px]" />
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      focusedField === 'password' 
                        ? 'bg-primary/10 scale-110' 
                        : 'bg-gray-100'
                    }`}>
                      <Lock className={`w-3.5 h-3.5 transition-all duration-300 ${
                        focusedField === 'password' ? 'text-primary' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="w-px h-5 bg-gray-200" />
                  </div>
                  
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-16 pr-12 h-11 text-sm transition-all duration-300 focus:ring-0 border-2 border-gray-200 focus:border-primary bg-white hover:bg-gray-50 focus:bg-white rounded-lg font-medium"
                    required
                    disabled={loading}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 transition-all duration-200 group disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    ) : (
                      <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  {password && (
                    <div className="absolute -bottom-5 left-0 right-0">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                              password.length >= level * 2
                                ? password.length >= 8
                                  ? 'bg-green-500'
                                  : password.length >= 6
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón COMPACTO */}
            <Button 
              type="submit" 
              className="w-full h-11 relative overflow-hidden group/btn disabled:opacity-50 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(113,120,91,0.4)] hover:scale-[1.02] bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-sm font-bold mt-6 rounded-lg border-0"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent_50%)]" />
              
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-particle-rise"
                    style={{
                      left: `${20 + i * 15}%`,
                      bottom: '0',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="relative w-4 h-4">
                      <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <div className="absolute inset-0.5 border-2 border-white/20 border-t-white rounded-full animate-spin-reverse" />
                    </div>
                    <span className="animate-pulse font-black tracking-wide">INGRESANDO...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 group-hover/btn:rotate-[360deg] transition-transform duration-700" />
                    <span className="font-black tracking-wide">INICIAR SESIÓN</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>

              <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </Button>
          </form>

          {/* Footer COMPACTO */}
          <div className="pt-4 mt-2">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 shadow-md shadow-green-100/30 backdrop-blur-sm p-2 group/security hover:scale-[1.01] transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/security:translate-x-full transition-transform duration-1000" />
              
              <div className="relative flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <p className="text-xs font-bold text-green-700">
                  Sitio Seguro
                </p>
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
        </CardContent>

        <div className="absolute -bottom-px left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7C4A36]/60 to-transparent rounded-full" />
      </Card>

      <style jsx>{`
        @keyframes float-3d {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0.2;
          }
          25% {
            opacity: 0.5;
          }
          50% {
            transform: translate3d(-20px, -30px, 20px) rotate(180deg);
            opacity: 0.8;
          }
          75% {
            opacity: 0.5;
          }
        }

        @keyframes twinkle-star {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes card-entrance {
          from {
            opacity: 0;
            transform: translateY(60px) scale(0.9) rotateX(20deg);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
            filter: blur(0px);
          }
        }

        @keyframes shimmer-fast {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes shimmer-fast-delayed {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes shimmer-vertical {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes shimmer-vertical-delayed {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes pulse-ring-1 {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.6;
          }
        }

        @keyframes pulse-ring-2 {
          0%, 100% {
            transform: scale(1);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.5;
          }
        }

        @keyframes shield-breathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 15px rgba(255,255,255,0.9));
          }
        }

        @keyframes orbit-1 {
          0% {
            transform: rotate(0deg) translateX(45px) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(45px) rotate(-360deg);
            opacity: 0.4;
          }
        }

        @keyframes orbit-2 {
          0% {
            transform: rotate(90deg) translateX(42px) rotate(-90deg);
            opacity: 0.3;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            transform: rotate(450deg) translateX(42px) rotate(-450deg);
            opacity: 0.3;
          }
        }

        @keyframes orbit-4 {
          0% {
            transform: rotate(270deg) translateX(44px) rotate(-270deg);
            opacity: 0.4;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            transform: rotate(630deg) translateX(44px) rotate(-630deg);
            opacity: 0.4;
          }
        }

        @keyframes rotate-shine {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes text-shimmer-slow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes pulse-width {
          0%, 100% {
            width: 4rem;
            opacity: 0.6;
          }
          50% {
            width: 5rem;
            opacity: 1;
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shake-intense {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-8px) rotate(-1deg); }
          20% { transform: translateX(8px) rotate(1deg); }
          30% { transform: translateX(-8px) rotate(-1deg); }
          40% { transform: translateX(8px) rotate(1deg); }
          50% { transform: translateX(-8px) rotate(-1deg); }
          60% { transform: translateX(8px) rotate(1deg); }
          70% { transform: translateX(-8px) rotate(-1deg); }
          80% { transform: translateX(8px) rotate(1deg); }
          90% { transform: translateX(-8px) rotate(-1deg); }
        }

        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes particle-rise {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-25px) scale(1);
            opacity: 0;
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes gradient-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes float-ambient {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-30px, -40px) scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes float-ambient-delayed {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.25;
          }
          50% {
            transform: translate(40px, -30px) scale(1.15);
            opacity: 0.45;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.1);
          }
        }

        @keyframes grid-move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 50px 50px;
          }
        }

        .animate-float-3d {
          animation: float-3d ease-in-out infinite;
        }

        .animate-twinkle-star {
          animation: twinkle-star ease-in-out infinite;
        }

        .animate-card-entrance {
          animation: card-entrance 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-shimmer-fast {
          animation: shimmer-fast 2s linear infinite;
        }

        .animate-shimmer-fast-delayed {
          animation: shimmer-fast-delayed 2s linear infinite;
          animation-delay: 1s;
        }

        .animate-shimmer-vertical {
          animation: shimmer-vertical 3s linear infinite;
        }

        .animate-shimmer-vertical-delayed {
          animation: shimmer-vertical-delayed 3s linear infinite;
          animation-delay: 1.5s;
        }

        .animate-pulse-ring-1 {
          animation: pulse-ring-1 3s ease-in-out infinite;
        }

        .animate-pulse-ring-2 {
          animation: pulse-ring-2 3s ease-in-out infinite;
          animation-delay: 0.3s;
        }

        .animate-shield-breathe {
          animation: shield-breathe 3s ease-in-out infinite;
        }

        .animate-orbit-1 {
          animation: orbit-1 8s linear infinite;
        }

        .animate-orbit-2 {
          animation: orbit-2 10s linear infinite;
        }

        .animate-orbit-4 {
          animation: orbit-4 11s linear infinite;
        }

        .animate-rotate-shine {
          animation: rotate-shine 3s linear infinite;
        }

        .animate-text-shimmer-slow {
          animation: text-shimmer-slow 5s linear infinite;
        }

        .animate-pulse-width {
          animation: pulse-width 2s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-shake-intense {
          animation: shake-intense 0.6s ease-in-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-particle-rise {
          animation: particle-rise 2s ease-out infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }

        .animate-gradient-rotate {
          animation: gradient-rotate 20s linear infinite;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 4s ease-in-out infinite;
        }

        .animate-float-ambient {
          animation: float-ambient 12s ease-in-out infinite;
        }

        .animate-float-ambient-delayed {
          animation: float-ambient-delayed 15s ease-in-out infinite;
          animation-delay: 2s;
        }

        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }

        .animate-grid-move {
          animation: grid-move 20s linear infinite;
        }
      `}</style>
    </div>
  )
}