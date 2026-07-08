import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders")).data,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/orders/${id}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}

// Public — guest checkout, no auth header required.
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload) => (await api.post("/orders", payload)).data,
  })
}

// Public — order status lookup by id.
export function useTrackOrder(id) {
  return useQuery({
    queryKey: ["order-track", id],
    queryFn: async () => (await api.get(`/orders/${id}/track`)).data,
    enabled: Boolean(id),
  })
}
