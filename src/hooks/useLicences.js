import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

// --- customer ---------------------------------------------------------------

export function useMyLicences() {
  return useQuery({
    queryKey: ["my-licences"],
    queryFn: async () => (await api.get("/licences/mine")).data,
  })
}

// Unlocking is a POST because it has a side effect: the server records who
// opened the licence, from where, and when. Never cache the result.
//
// The response carries the file's password but NOT its URL — the download is
// only reachable through the redirect below, so there is no link anywhere in
// the page to right-click and copy.
export function useUnlockLicence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (key) => (await api.post("/licences/unlock", { key })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-licences"] }),
  })
}

// Mints a single-use ticket and navigates to it. The real download URL never
// reaches the browser as data — the server answers the navigation with a
// redirect, so there's nothing in the DOM or in any response body to copy.
export function useOpenLicenceFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (key) => {
      const { data } = await api.post("/licences/open-token", { key })
      window.open(`/api/licences/open/${data.token}`, "_blank", "noopener,noreferrer")
    },
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
