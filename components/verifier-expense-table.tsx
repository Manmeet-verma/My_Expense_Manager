"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { verifyExpense } from "@/actions/expense"
import { Check, X } from "lucide-react"

type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID"
type DisplayStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "ALL"

interface VerifierExpense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  status: ExpenseStatus
  createdAt: string
  createdBy: {
    name: string | null
    email: string
    assignedProject: string[] | null
  }
  approvedBy: {
    id: string
    name: string | null
    email: string
    role: "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER"
  } | null
}

interface VerifierExpenseTableProps {
  expenses: VerifierExpense[]
  actorRole: "SUPERVISOR" | "VERIFIER"
  activeStatus: string
  onStatusChange: (s: string) => void
}

function formatCategory(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getStatusBadgeVariant(status: DisplayStatus): "warning" | "success" | "destructive" | "secondary" | "default" {
  if (status === "PENDING") return "warning"
  if (status === "APPROVED" || status === "PAID") return "success"
  if (status === "REJECTED") return "destructive"
  return "secondary"
}

export function VerifierExpenseTable({ expenses, actorRole, activeStatus, onStatusChange }: VerifierExpenseTableProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const statusButtons: DisplayStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"]

  function getStatusButtonLabel(status: DisplayStatus): string {
    return status === "ALL" ? "ALL" : status
  }

  async function handleApprove(id: string) {
    setProcessingId(id)
    const result = await verifyExpense({ id, status: "APPROVED" })
    if (result?.error) {
      alert(result.error)
    }
    setProcessingId(null)
    router.refresh()
  }

  async function handleReject(id: string) {
    const reason = prompt("Please enter reason for rejection:")
    if (!reason?.trim()) return
    setProcessingId(id)
    const result = await verifyExpense({ id, status: "REJECTED", adminRemark: reason.trim() })
    if (result?.error) {
      alert(result.error)
    }
    setProcessingId(null)
    router.refresh()
  }

  const rows = useMemo(
    () =>
      expenses.map((exp) => ({
        id: exp.id,
        site: exp.createdBy?.name || exp.createdBy?.email || "Unknown",
        project: exp.createdBy?.assignedProject?.join(", ") || "-",
        expenseHead: formatCategory(exp.category),
        mainHead: exp.title || "-",
        status: exp.status,
        approvedByName: exp.approvedBy?.name || null,
        approvedByRole: exp.approvedBy?.role || null,
        amount: exp.amount,
        createdAt: exp.createdAt,
      })),
    [expenses]
  )

  const filteredRows = useMemo(() => {
    if (activeStatus === "ALL") return rows
    return rows.filter((row) => row.status === activeStatus)
  }, [rows, activeStatus])

  const statusCounts = useMemo(() => {
    const pending = expenses.filter((e) => e.status === "PENDING").length
    const approved = expenses.filter((e) => e.status === "APPROVED").length
    const rejected = expenses.filter((e) => e.status === "REJECTED").length
    const paid = expenses.filter((e) => e.status === "PAID").length
    return { pending, approved, rejected, paid }
  }, [expenses])

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {statusButtons.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`rounded border px-3 py-1.5 text-xs sm:text-sm ${
              activeStatus === status
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            {getStatusButtonLabel(status)}
            {status !== "ALL" && status !== "PAID" && (
              <span className="ml-1 text-gray-500">
                ({status === "PENDING" ? statusCounts.pending : status === "APPROVED" ? statusCounts.approved : statusCounts.rejected})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Sr</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Inputter</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Expenses Head</th>
              <th className="px-4 py-3 font-semibold">Main Head</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Approved By</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  No expenses found
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr key={row.id} className="border-t border-gray-100 odd:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{row.site}</td>
                  <td className="px-4 py-3 text-gray-700">{row.project}</td>
                  <td className="px-4 py-3 text-gray-700">{row.expenseHead}</td>
                  <td className="px-4 py-3 text-gray-900">{row.mainHead}</td>
                  <td className="px-4 py-3 text-gray-900 font-semibold">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.status === "PENDING" ? "Pending" : row.approvedByName || "Admin"}
                    {row.approvedByRole === "ADMIN" && row.approvedByName ? " (Admin)" : ""}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === "PENDING" && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => void handleApprove(row.id)}
                          disabled={processingId === row.id}
                          title="Approve"
                          className="h-7 px-2 text-xs"
                        >
                          <Check className="h-3.5 w-3.5 mr-0.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleReject(row.id)}
                          disabled={processingId === row.id}
                          title="Reject"
                          className="h-7 px-2 text-xs"
                        >
                          <X className="h-3.5 w-3.5 mr-0.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {row.status === "APPROVED" && (
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Approved
                      </span>
                    )}
                    {row.status === "REJECTED" && (
                      <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                        Rejected
                      </span>
                    )}
                    {row.status === "PAID" && (
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
