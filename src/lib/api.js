import axios from "axios"

export const api = axios.create({ baseURL: "/api" })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rs_admin_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Centralised 401 handling: drop the stale token and let AuthContext's
// consumers redirect via the ProtectedAdminRoute check on next render.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("rs_admin_token")
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong"
}
