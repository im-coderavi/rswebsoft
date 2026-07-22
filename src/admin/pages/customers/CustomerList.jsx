import { useNavigate } from "react-router-dom"
import { useCustomers } from "../../../hooks/useUsers"
import { formatINR } from "../../../lib/currency"
import DataTable from "../../components/DataTable"

export default function CustomerList() {
  const { data: customers, isLoading } = useCustomers()
  const navigate = useNavigate()

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "orderCount", label: "Orders" },
    { key: "totalSpent", label: "Total Spent", render: (c) => formatINR(c.totalSpent) },
    { key: "createdAt", label: "Joined", render: (c) => new Date(c.createdAt).toLocaleDateString() },
  ]

  return (
    <DataTable
      columns={columns}
      rows={(customers || []).map((c) => ({ ...c, _id: c.id }))}
      loading={isLoading}
      emptyMessage="No registered customers yet."
      actions={(c) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/customers/${c.id}`)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-cloud-200 hover:border-brand-500/50"
        >
          View
        </button>
      )}
    />
  )
}
