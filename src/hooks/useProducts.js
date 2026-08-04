import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useProducts(params = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => (await api.get("/products", { params })).data,
    placeholderData: (prev) => prev,
  })
}

export function useProduct(id) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: Boolean(id),
  })
}

// The delivered file and its password are not part of the product payload —
// they live behind an admin-only route so they can never leak into a
// storefront response. The product form fetches them separately.
export function useProductDownloadConfig(id) {
  return useQuery({
    queryKey: ["product-download-config", id],
    queryFn: async () => (await api.get(`/products/${id}/download-config`)).data,
    enabled: Boolean(id),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post("/products", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/products/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  })
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids) => (await api.post("/products/bulk-delete", { ids })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  })
}

export function useBulkUpdateProductStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, status }) => (await api.patch("/products/bulk-status", { ids, status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  })
}
