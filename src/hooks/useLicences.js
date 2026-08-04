import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

// --- customer ---------------------------------------------------------------

export function useMyLicences() {
  return useQuery({
    queryKey: ["my-licences"],
    queryFn: async () => (await api.get("/licences/mine")).data,
  })
}

// Revealing is a POST because it has a side effect: the server records who
// opened the licence, from where, and when. Never cache the result.
export function useRevealLicence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (key) => (await api.post(`/licences/${key}/reveal`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-licences"] }),
  })
}

// --- admin ------------------------------------------------------------------

export function useLicences() {
  return useQuery({
    queryKey: ["licences"],
    queryFn: async () => (await api.get("/licences")).data,
  })
}

export function useLicence(id) {
  return useQuery({
    queryKey: ["licence", id],
    queryFn: async () => (await api.get(`/licences/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useSetLicenceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, reason }) =>
      (await api.patch(`/licences/${id}/status`, { status, reason })).data,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["licences"] })
      qc.invalidateQueries({ queryKey: ["licence", variables.id] })
    },
  })
}
