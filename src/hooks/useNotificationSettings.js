import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

// Admin only — this endpoint returns an API key, so there is deliberately no
// public equivalent.
export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => (await api.get("/notification-settings")).data,
  })
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.put("/notification-settings", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-settings"] }),
  })
}

export function useTestNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post("/notification-settings/test")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-settings"] }),
  })
}
