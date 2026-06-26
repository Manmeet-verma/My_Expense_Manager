"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { deleteExpense, markExpensePaid } from "@/actions/expense"
import { broadcastExpenseChange } from "@/lib/supabase/realtime"
import { EditExpenseModal } from "@/components/edit-expense-modal"
import { DeleteExpenseConfirm } from "@/components/delete-expense-confirm"
import { Edit, Trash2 } from "lucide-react"

type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID"
type DisplayStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "COLLECTION" | "ALL"

interface MemberDashboardExpense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  status: ExpenseStatus
  approvedByName?: string | null
  approvedByRole?: "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER" | null
}

interface Fund {
  id: string
  amount: number
  receivedFrom: string
  paymentMode: string
  fundDate: Date
  createdAt: Date
}

interface MemberDashboardStatusTableProps {
  site: string
  expenses: MemberDashboardExpense[]
  funds?: Fund[]
}

function formatCategory(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getDisplayStatus(status: ExpenseStatus): Exclude<DisplayStatus, "ALL" | "COLLECTION"> {
  if (status === "PAID") return "PAID"
  if (status === "APPROVED") return "APPROVED"
  return status
}

function getStatusBadgeVariant(
  status: Exclude<DisplayStatus, "ALL" | "COLLECTION">
): "warning" | "success" | "destructive" | "secondary" {
  if (status === "PENDING") return "warning"
  if (status === "APPROVED" || status === "PAID") return "success"
  if (status === "REJECTED") return "destructive"
  return "secondary"
}

function actionTakenBy(
  status: Exclude<DisplayStatus, "ALL" | "COLLECTION">,
  approvedByName?: string | null,
  approvedByRole?: MemberDashboardExpense["approvedByRole"]
): string {
  if (status === "PENDING") return "Pending Review"

  // Treat PAID the same as APPROVED for action label purposes
  if (status === "APPROVED" || status === "PAID") {
    if (approvedByRole === "SUPERVISOR" || approvedByRole === "VERIFIER") {
      return approvedByName || "Supervisor"
    }
    // When admin approved, make it explicit for the inputter
    if (approvedByRole === "ADMIN") {
      return approvedByName ? `${approvedByName} (Approved by Admin)` : "Admin (Approved)"
    }
    return approvedByName || "Admin"
  }

  if (status === "REJECTED") return approvedByName || "Supervisor"
  return approvedByName || "Supervisor"
}

function inputterAction(status: Exclude<DisplayStatus, "ALL" | "COLLECTION">): string {
  if (status === "PENDING") return "Submitted (can edit/delete)"
  return "Submitted"
}

interface MemberDashboardStatusTablePropsExtended extends MemberDashboardStatusTableProps {
  activeStatus?: DisplayStatus
  onStatusChange?: (s: DisplayStatus) => void
}

export function MemberDashboardStatusTable({
  site,
  expenses,
  funds = [],
  activeStatus: externalActiveStatus,
  onStatusChange,
}: MemberDashboardStatusTablePropsExtended) {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState<DisplayStatus>(externalActiveStatus ?? "ALL")
  const [selectedSupervisor, setSelectedSupervisor] = useState("ALL")
  const [editingExpense, setEditingExpense] = useState<MemberDashboardExpense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null)

  useEffect(() => {
    if (externalActiveStatus !== undefined && externalActiveStatus !== activeStatus) {
      setActiveStatus(externalActiveStatus)
      setSelectedSupervisor("ALL")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalActiveStatus])

  async function handleMarkPaid(id: string) {
    if (payingExpenseId) return
    setPayingExpenseId(id)
    const result = await markExpensePaid({ id })
    if (result?.error) {
      alert(result.error)
      setPayingExpenseId(null)
      return
    }
    void broadcastExpenseChange("member-paid")
    setPayingExpenseId(null)
    router.refresh()
  }

  const rows = useMemo(
    () =>
      expenses.map((expense) => ({
        id: expense.id,
        site,
        expenseHead: formatCategory(expense.category),
        mainHead: expense.title || "-",
        status: getDisplayStatus(expense.status),
        approvedByName: expense.approvedByName,
        approvedByRole: expense.approvedByRole,
      })),
    [expenses, site]
  )

  const filteredRows = useMemo(() => {
    if (activeStatus === "ALL") return rows
    if (activeStatus === "COLLECTION") return []
    if (activeStatus === "APPROVED") {
      return rows.filter(
        (row) =>
          row.status === "APPROVED" &&
          // include supervisor/verifier *and* admin approvals so inputter sees admin-approved items
          (row.approvedByRole === "SUPERVISOR" || row.approvedByRole === "VERIFIER" || row.approvedByRole === "ADMIN") &&
          (selectedSupervisor === "ALL" || row.approvedByName === selectedSupervisor)
      )
    }
    return rows.filter((row) => row.status === activeStatus)
  }, [rows, activeStatus, selectedSupervisor])

  const supervisorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter((row) => row.approvedByRole === "SUPERVISOR" || row.approvedByRole === "VERIFIER")
            .map((row) => row.approvedByName)
            .filter((name): name is string => Boolean(name))
        )
      ).sort(),
    [rows]
  )

  const emptyStateMessage =
    activeStatus === "APPROVED"
      ? "No verified expenses found"
      : activeStatus === "COLLECTION"
        ? "No collections found"
        : "No expenses found for selected status"

  const statusButtons: DisplayStatus[] = ["ALL", "PENDING", "REJECTED", "APPROVED", "PAID", "COLLECTION"]

  function getStatusButtonLabel(status: DisplayStatus): string {
    if (status === "COLLECTION") return "RECEIVED FUND"
    if (status === "APPROVED") return "APPROVED"
    return status
  }

  const deleteConfirmExpense = expenses.find((e) => e.id === deletingExpenseId)

  async function handleDelete() {
    if (!deletingExpenseId) return
    setIsDeleting(true)
    const result = await deleteExpense(deletingExpenseId)
    if (result?.success) {
      void broadcastExpenseChange("member-delete")
      router.refresh()
    }
    setIsDeleting(false)
    setDeletingExpenseId(null)
  }

  return (
    <>
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Expense Checking Status (Site Wise)</h2>
        <div className="flex flex-wrap gap-2">
          {statusButtons.map((status) => (
            <button
              key={status}
              onClick={() => {
                setActiveStatus(status)
                onStatusChange?.(status)
              }}
              className={`rounded border px-3 py-1.5 text-xs sm:text-sm ${
                activeStatus === status ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {getStatusButtonLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {activeStatus === "APPROVED" && supervisorOptions.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label className="text-sm font-medium text-gray-700">Supervisor</label>
          <select
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="ALL">All Supervisors</option>
            {supervisorOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Sr</th>
              {activeStatus === "COLLECTION" ? (
                <>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Received From</th>
                  <th className="px-4 py-3 font-semibold">Payment Mode</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 font-semibold">Site</th>
                  <th className="px-4 py-3 font-semibold">Expenses Head</th>
                  <th className="px-4 py-3 font-semibold">Main Head</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Approved By (Name)</th>
                  <th className="px-4 py-3 font-semibold">Action of Inputter</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {activeStatus === "COLLECTION" ? (
              funds.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No collections found
                  </td>
                </tr>
              ) : (
                funds.map((fund, index) => (
                  <tr key={fund.id} className="border-t border-gray-100 odd:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(fund.fundDate)}</td>
                    <td className="px-4 py-3 text-gray-700">{fund.receivedFrom}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        {fund.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(fund.amount)}</td>
                  </tr>
                ))
              )
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  {emptyStateMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr key={row.id} className="border-t border-gray-100 odd:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{row.site}</td>
                  <td className="px-4 py-3 text-gray-700">{row.expenseHead}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.mainHead}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{actionTakenBy(row.status, row.approvedByName, row.approvedByRole)}</td>
                  <td className="px-4 py-3 text-gray-700">{inputterAction(row.status)}</td>
                  <td className="px-4 py-3">
                    {row.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingExpense(expenses.find((e) => e.id === row.id) || null)}
                          title="Edit pending expense"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingExpenseId(row.id)}
                          title="Delete pending expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {(row.status === "APPROVED" || row.status === "PAID") && (
                      row.status === "PAID" ? (
                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">Paid</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => void handleMarkPaid(row.id)}
                          disabled={payingExpenseId === row.id}
                          title="Mark expense as paid"
                        >
                          {payingExpenseId === row.id ? "Marking..." : "Pay"}
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          budget={0}
          totalAmountUsed={0}
          isOpen={Boolean(editingExpense)}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            void broadcastExpenseChange("member-edit")
            setEditingExpense(null)
            router.refresh()
          }}
        />
      )}

      {deleteConfirmExpense && (
        <DeleteExpenseConfirm
          isOpen={Boolean(deletingExpenseId)}
          onClose={() => setDeletingExpenseId(null)}
          onConfirm={handleDelete}
          expenseTitle={deleteConfirmExpense.title}
          isLoading={isDeleting}
        />
      )}
    </>
  )
}
