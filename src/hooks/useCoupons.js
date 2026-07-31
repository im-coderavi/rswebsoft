import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => (await api.get("/coupons")).data,
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post("/coupons", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/coupons/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/coupons/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  })
}

// Imperative call (not cached) — CartContext calls this directly and stores
// the result itself, since "the currently applied coupon" is cart state, not
// server-fetched data to cache.
export async function applyCouponRequest(code, items) {
  const { data } = await api.post("/coupons/apply", { code, items })
  return data
}
