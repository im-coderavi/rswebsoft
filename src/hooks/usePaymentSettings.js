import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function usePaymentSettings() {
  return useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => (await api.get("/payment-settings")).data,
  })
}

export function useUpdatePaymentSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.put("/payment-settings", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-settings"] }),
  })
}
