import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useSiteStats() {
  return useQuery({
    queryKey: ["site-stats"],
    queryFn: async () => (await api.get("/dashboard/public-stats")).data,
    staleTime: 5 * 60 * 1000,
  })
}
