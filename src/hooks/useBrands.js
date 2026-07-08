import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => (await api.get("/brands")).data,
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post("/brands", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  })
}

export function useUpdateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/brands/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/brands/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  })
}
