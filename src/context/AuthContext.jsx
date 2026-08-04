import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { api } from "../lib/api"

const AuthContext = createContext(null)
const TOKEN_KEY = "rs_token"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        // The server slides the session forward once the token is a week old,
        // so an active customer never gets signed out.
        if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
        setUser(data.user)
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async ({ name, email, phone, password }) => {
    const { data } = await api.post("/auth/register", { name, email, phone, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const forgotPassword = useCallback(async (identifier) => {
    const { data } = await api.post("/auth/forgot-password", { identifier })
    return data
  }, [])

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post("/auth/reset-password", { token, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const updateProfile = useCallback(async ({ name, phone }) => {
    const { data } = await api.patch("/auth/profile", { name, phone })
    setUser(data.user)
    return data.user
  }, [])

  const changePassword = useCallback(async (currentPassword, password) => {
    const { data } = await api.post("/auth/change-password", { currentPassword, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
