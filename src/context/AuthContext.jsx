import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

const AuthContext = createContext(null)
const TOKEN_KEY = "rs_token"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // Query keys like ["my-licences"] and ["my-orders"] aren't scoped to a user,
  // so without this the previous account's cached data is served to the next
  // person to sign in on the same browser — they'd see someone else's licences
  // and order history until a refetch landed. Wipe the cache on every identity
  // change rather than trying to remember which keys are per-user.
  const resetCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])

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
    resetCache()
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [resetCache])

  // Signing up is two calls: this one only sends the code. No account exists
  // until verifySignup below succeeds, so there is nothing to sign in to yet.
  const startSignup = useCallback(async ({ name, email, phone, password }) => {
    const { data } = await api.post("/auth/signup/start", { name, email, phone, password })
    return data
  }, [])

  const resendSignupOtp = useCallback(async (email) => {
    const { data } = await api.post("/auth/signup/resend", { email })
    return data
  }, [])

  const verifySignup = useCallback(async (email, code) => {
    const { data } = await api.post("/auth/signup/verify", { email, code })
    resetCache()
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [resetCache])

  const forgotPassword = useCallback(async (identifier) => {
    const { data } = await api.post("/auth/forgot-password", { identifier })
    return data
  }, [])

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post("/auth/reset-password", { token, password })
    resetCache()
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [resetCache])

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
    resetCache()
  }, [resetCache])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        startSignup,
        resendSignupOtp,
        verifySignup,
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
