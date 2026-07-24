import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useHomeSections() {
  return useQuery({
    queryKey: ["home-sections"],
    queryFn: async () => (await api.get("/home-sections")).data,
  })
}

export function useAdminHomeSections() {
  return useQuery({
    queryKey: ["home-sections", "admin"],
    queryFn: async () => (await api.get("/home-sections/admin")).data,
  })
}

export function useCreateHomeSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post("/home-sections", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}

export function useUpdateHomeSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/home-sections/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}

export function useDeleteHomeSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/home-sections/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}

export function useReorderHomeSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids) => (await api.patch("/home-sections/reorder", { ids })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}
