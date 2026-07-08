import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get("/dashboard/stats")).data,
  })
}
