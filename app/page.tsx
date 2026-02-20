"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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

      if (!data.id || !data.role) {
        setError("Error en la respuesta del servidor")
        setLoading(false)
        return
      }

      sessionStorage.setItem("currentUser", JSON.stringify(data))
      sessionStorage.setItem("jwtToken", data.token)

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("No se pudo conectar con el servidor")
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: "url('/images/Repopa.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: "8%",
      }}
    >
      {/* Card de login posicionada sobre el lado derecho claro */}
      <div
        style={{
          backgroundColor: "rgba(125, 140, 124, 0.88)",
          borderRadius: "16px",
          padding: "48px 40px",
          width: "380px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          backdropFilter: "blur(6px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        {/* Logo circular */}
        <img
          src="/images/LogoQuetzal.svg"
          alt="Logo Quetzal"
          style={{
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            border: "2.5px solid rgba(255,255,255,0.75)",
            objectFit: "cover",
            marginBottom: "4px",
          }}
        />

        {/* Título y subtítulo estilo REPOPA */}
        <div style={{ textAlign: "center", color: "white", marginTop: "-4px" }}>
          <p style={{
            fontSize: "28px",
            fontWeight: "900",
            margin: "0 0 2px 0",
            lineHeight: "1.1",
            letterSpacing: "1px",
            textTransform: "uppercase",
            textShadow: "0 2px 6px rgba(0,0,0,0.35)",
          }}>
            REPOPA
          </p>
          <p style={{
            fontSize: "15px",
            fontWeight: "500",
            margin: "0 0 6px 0",
            lineHeight: "1.4",
            opacity: 0.9,
          }}>
            Registro Público de Organismos<br/>Públicos Auxiliares
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginTop: "6px" }}>
            <div style={{ height: "1px", width: "35px", backgroundColor: "rgba(255,255,255,0.55)" }} />
            <p style={{ fontSize: "15px", fontWeight: "500", margin: 0, opacity: 0.9, whiteSpace: "nowrap" }}>
              Procuraduría Fiscal
            </p>
            <div style={{ height: "1px", width: "35px", backgroundColor: "rgba(255,255,255,0.55)" }} />
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div style={{
            width: "100%",
            backgroundColor: "rgba(200,50,50,0.35)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Campo usuario */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "white", fontSize: "13px", fontWeight: "600", paddingLeft: "2px" }}>
              Correo Electrónico
            </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                padding: "0 44px 0 16px",
                color: "white",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <svg style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)" }}
              width="20" height="20" viewBox="0 0 24 24" fill="rgba(100,100,100,0.6)">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          </div>

          {/* Campo contraseña */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "white", fontSize: "13px", fontWeight: "600", paddingLeft: "2px" }}>
              Contraseña
            </label>
          <div style={{ position: "relative" }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                padding: "0 44px 0 16px",
                color: "white",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <svg style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)" }}
              width="20" height="20" viewBox="0 0 24 24" fill="rgba(100,100,100,0.6)">
              <path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.7 1.4-3.1 3.1-3.1 1.7 0 3.1 1.4 3.1 3.1v2z"/>
            </svg>
          </div>
          </div>

          {/* Botón LOGIN */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",
              backgroundColor: "#3d4d3c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "700",
              letterSpacing: "2px",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "4px",
              opacity: loading ? 0.7 : 1,
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "#2c3a2b" }}
            onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "#3d4d3c" }}
          >
            {loading ? "..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  )
}