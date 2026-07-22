import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await api.get("/users")).data,
  })
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => (await api.get(`/users/${id}`)).data,
    enabled: Boolean(id),
  })
}
