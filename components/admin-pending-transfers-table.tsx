"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { approvePendingFundTransfer, rejectPendingFundTransfer } from "@/actions/expense"
import { Button } from "@/components/ui/button"
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

interface AdminPendingTransfersTableProps {
  transactions: Transaction[]
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatPaymentMode(paymentMode: "CASH" | "GPAY" | "BANK_ACCOUNT") {
  if (paymentMode === "BANK_ACCOUNT") return "Bank Account"
  if (paymentMode === "GPAY") return "GPay"
  return "Cash"
}

export function AdminPendingTransfersTable({
  transactions,
}: AdminPendingTransfersTableProps) {
  const router = useRouter()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function handleApprove(transactionId: string) {
    setActionId(transactionId)
    setError("")
    const result = await approvePendingFundTransfer({ transactionId })
    if (result?.error) {
      setError(result.error)
      setActionId(null)
      return
    }
    setActionId(null)
    router.refresh()
  }

  async function handleReject(transactionId: string) {
    setActionId(transactionId)
    setError("")
    const result = await rejectPendingFundTransfer({ transactionId })
    if (result?.error) {
      setError(result.error)
      setActionId(null)
      return
    }
    setActionId(null)
    router.refresh()
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-gray-500">No pending verifier transfer requests.</p>
  }

  return (
    <div>
      {error && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-3 md:hidden">
        {transactions.map((transaction) => {
          const isPending = actionId === transaction.id
          return (
            <div key={transaction.id} className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {transaction.user.name || transaction.user.email}
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment:</span>
                  <span className="text-gray-700">{formatPaymentMode(transaction.paymentMode)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-700">{formatDateTime(transaction.fundDate || transaction.createdAt)}</span>
                </div>
                {transaction.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Note:</span>
                    <span className="text-gray-700">{transaction.description}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(transaction.id)}
                  disabled={isPending}
                >
                  {isPending ? "Processing..." : "Approve"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => handleReject(transaction.id)}
                  disabled={isPending}
                >
                  {isPending ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Inputter</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Payment Method</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const isPending = actionId === transaction.id
              return (
                <tr key={transaction.id} className="border-t border-gray-100 align-top odd:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {transaction.user.name || transaction.user.email}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {transaction.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatPaymentMode(transaction.paymentMode)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDateTime(transaction.fundDate || transaction.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(transaction.id)}
                        disabled={isPending}
                      >
                        {isPending ? "..." : "Approve"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => handleReject(transaction.id)}
                        disabled={isPending}
                      >
                        {isPending ? "..." : "Reject"}
                      </Button>
                    </div>
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
