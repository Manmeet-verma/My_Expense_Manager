"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  deleteDistributedFundTransaction,
  updateDistributedFundTransaction,
} from "@/actions/expense"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExportExcelButton } from "@/components/export-excel-button"
import { formatCurrency } from "@/lib/utils"

type Transaction = {
  id: string
  amount: number
  description?: string | null
  paymentMode: "CASH" | "GPAY" | "BANK_ACCOUNT"
  fundDate: Date | string
  createdAt: Date | string
  user: {
    name: string | null
    email: string
  }
}

interface AdminDistributionTransactionsTableProps {
  transactions: Transaction[]
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))
}

function toDateTimeLocalValue(value: Date | string) {
  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function formatPaymentMode(paymentMode: "CASH" | "GPAY" | "BANK_ACCOUNT") {
  if (paymentMode === "BANK_ACCOUNT") return "Bank Account"
  if (paymentMode === "GPAY") return "GPay"
  return "Cash"
}

export function AdminDistributionTransactionsTable({
  transactions,
}: AdminDistributionTransactionsTableProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState("")
  const [editingDescription, setEditingDescription] = useState("")
  const [editingPaymentMode, setEditingPaymentMode] = useState<"CASH" | "GPAY" | "BANK_ACCOUNT">("CASH")
  const [editingFundDate, setEditingFundDate] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const transactionMap = useMemo(
    () => new Map(transactions.map((transaction) => [transaction.id, transaction])),
    [transactions]
  )

  const exportData = useMemo(
    () =>
      transactions.map((transaction, index) => ({
        "Sr No": index + 1,
        Inputter: transaction.user.name || transaction.user.email,
        Amount: transaction.amount,
        Description: transaction.description || "-",
        "Payment Method": formatPaymentMode(transaction.paymentMode),
        "Transaction Date": formatDateTime(transaction.fundDate || transaction.createdAt),
      })),
    [transactions]
  )

  function startEdit(transactionId: string) {
    const transaction = transactionMap.get(transactionId)
    if (!transaction) {
      return
    }

    setError("")
    setEditingId(transactionId)
    setEditingAmount(String(transaction.amount))
    setEditingDescription(transaction.description || "")
    setEditingPaymentMode(transaction.paymentMode)
    setEditingFundDate(toDateTimeLocalValue(transaction.fundDate))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingAmount("")
    setEditingDescription("")
    setEditingPaymentMode("CASH")
    setEditingFundDate("")
  }

  async function saveEdit(transactionId: string) {
    const parsedAmount = parseFloat(editingAmount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    if (!editingFundDate) {
      setError("Fund date is required")
      return
    }

    setPendingId(transactionId)
    setError("")

    const result = await updateDistributedFundTransaction({
      transactionId,
      amount: parsedAmount,
      description: editingDescription,
      paymentMode: editingPaymentMode,
      fundDate: new Date(editingFundDate).toISOString(),
    })

    if (result?.error) {
      setError(result.error)
      setPendingId(null)
      return
    }

    cancelEdit()
    setPendingId(null)
    router.refresh()
  }

  async function handleDelete(transactionId: string) {
    if (!confirm("Are you sure you want to delete this distribution transaction?")) {
      return
    }

    setPendingId(transactionId)
    setError("")

    const result = await deleteDistributedFundTransaction({ transactionId })

    if (result?.error) {
      setError(result.error)
      setPendingId(null)
      return
    }

    setPendingId(null)
    router.refresh()
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-gray-500">No distribution transactions yet.</p>
  }

  return (
    <div>
      {error && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="mb-3 flex justify-end">
        <ExportExcelButton
          data={exportData}
          fileName="fund-distribution-transactions"
          sheetName="Transactions"
          label="Export Excel"
        />
      </div>

      <div className="space-y-3 md:hidden">
        {transactions.map((transaction) => {
          const isEditing = editingId === transaction.id
          const isPending = pendingId === transaction.id

          return (
            <div key={transaction.id} className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {transaction.user.name || transaction.user.email}
              </p>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Amount</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editingAmount}
                      onChange={(event) => setEditingAmount(event.target.value)}
                      disabled={isPending}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-500">Description</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editingDescription}
                      onChange={(event) => setEditingDescription(event.target.value)}
                      disabled={isPending}
                      placeholder="Optional description"
                    />
                  ) : (
                    <p className="text-sm text-gray-700">{transaction.description || "-"}</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-500">Payment Method</p>
                  {isEditing ? (
                    <select
                      value={editingPaymentMode}
                      onChange={(event) => setEditingPaymentMode(event.target.value as "CASH" | "GPAY" | "BANK_ACCOUNT")}
                      disabled={isPending}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="GPAY">GPay</option>
                      <option value="BANK_ACCOUNT">Bank Account</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-700">{formatPaymentMode(transaction.paymentMode)}</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-500">Transaction Date</p>
                  {isEditing ? (
                    <Input
                      type="datetime-local"
                      value={editingFundDate}
                      onChange={(event) => setEditingFundDate(event.target.value)}
                      disabled={isPending}
                    />
                  ) : (
                    <p className="text-sm text-gray-700">
                      {formatDateTime(transaction.fundDate || transaction.createdAt)}
                    </p>
                  )}
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveEdit(transaction.id)}
                      disabled={isPending}
                    >
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(transaction.id)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(transaction.id)}
                      disabled={isPending}
                    >
                      {isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Inputter</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Payment Method</th>
              <th className="px-4 py-3 font-semibold">Transaction Date</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const isEditing = editingId === transaction.id
              const isPending = pendingId === transaction.id

              return (
                <tr key={transaction.id} className="border-t border-gray-100 align-top odd:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {transaction.user.name || transaction.user.email}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editingAmount}
                        onChange={(event) => setEditingAmount(event.target.value)}
                        disabled={isPending}
                        className="w-36"
                      />
                    ) : (
                      formatCurrency(transaction.amount)
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {isEditing ? (
                      <Input
                        type="text"
                        value={editingDescription}
                        onChange={(event) => setEditingDescription(event.target.value)}
                        disabled={isPending}
                        placeholder="Optional description"
                        className="w-56"
                      />
                    ) : (
                      transaction.description || "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {isEditing ? (
                      <select
                        value={editingPaymentMode}
                        onChange={(event) => setEditingPaymentMode(event.target.value as "CASH" | "GPAY" | "BANK_ACCOUNT")}
                        disabled={isPending}
                        className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="CASH">Cash</option>
                        <option value="GPAY">GPay</option>
                        <option value="BANK_ACCOUNT">Bank Account</option>
                      </select>
                    ) : (
                      formatPaymentMode(transaction.paymentMode)
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={editingFundDate}
                        onChange={(event) => setEditingFundDate(event.target.value)}
                        disabled={isPending}
                        className="w-56"
                      />
                    ) : (
                      formatDateTime(transaction.fundDate || transaction.createdAt)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveEdit(transaction.id)}
                          disabled={isPending}
                        >
                          {isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(transaction.id)}
                          disabled={isPending}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={isPending}
                        >
                          {isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
