import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useSubscribe() {
  return useMutation({
    mutationFn: async (email) => (await api.post("/subscribers", { email })).data,
  })
}

export function useSubscribers() {
  return useQuery({
    queryKey: ["subscribers"],
    queryFn: async () => (await api.get("/subscribers")).data,
  })
}

export function useDeleteSubscriber() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/subscribers/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  })
}
