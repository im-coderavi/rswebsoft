import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useDeliveredWebsiteSettings() {
  return useQuery({
    queryKey: ["delivered-website-settings"],
    queryFn: async () => (await api.get("/delivered-website-settings")).data,
  })
}

export function useUpdateDeliveredWebsiteSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.put("/delivered-website-settings", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivered-website-settings"] }),
  })
}
