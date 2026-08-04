import axios from "axios"

export const api = axios.create({ baseURL: "/api" })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rs_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 from these endpoints means "the credentials you just typed are wrong",
// not "your session has expired". Clearing the token here would sign a user
// out for mistyping their current password on the profile page — they'd be
// bounced to the home page with no idea why.
const CREDENTIAL_CHECK_PATHS = ["/auth/login", "/auth/change-password"]

// Centralised 401 handling: drop the stale token and let route guards
// (RequireAuth / ProtectedAdminRoute) redirect via useAuth's consumers on
// next render.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? ""
    const isCredentialCheck = CREDENTIAL_CHECK_PATHS.some((path) => url.endsWith(path))

    if (error.response?.status === 401 && !isCredentialCheck) {
      localStorage.removeItem("rs_token")
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong"
}
