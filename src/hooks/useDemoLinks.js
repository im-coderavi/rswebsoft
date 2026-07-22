import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useDemoLinks() {
  return useQuery({
    queryKey: ["demo-links"],
    queryFn: async () => (await api.get("/demo-links")).data,
  })
}

export function useCreateDemoLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post("/demo-links", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demo-links"] }),
  })
}

export function useUpdateDemoLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/demo-links/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demo-links"] }),
  })
}

export function useDeleteDemoLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/demo-links/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demo-links"] }),
  })
}
