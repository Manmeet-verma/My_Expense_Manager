"use client"

import { useMemo } from "react"
import { formatCurrency } from "@/lib/utils"

type Transaction = {
  id: string
  amount: number
  description?: string | null
  paymentMode: "CASH" | "GPAY" | "BANK_ACCOUNT"
  fundDate: Date | string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: Date | string
  adminRemark?: string | null
  user: {
    name: string | null
    email: string
  }
}

interface VerifierDistributionTransactionsTableProps {
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

function formatPaymentMode(paymentMode: "CASH" | "GPAY" | "BANK_ACCOUNT") {
  if (paymentMode === "BANK_ACCOUNT") return "Bank Account"
  if (paymentMode === "GPAY") return "GPay"
  return "Cash"
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  )
}

export function VerifierDistributionTransactionsTable({
  transactions,
}: VerifierDistributionTransactionsTableProps) {
  const exportData = useMemo(
    () =>
      transactions.map((transaction, index) => ({
        "Sr No": index + 1,
        Inputter: transaction.user.name || transaction.user.email,
        Amount: transaction.amount,
        Description: transaction.description || "-",
        "Payment Method": formatPaymentMode(transaction.paymentMode),
        Status: transaction.status,
        "Transaction Date": formatDateTime(transaction.fundDate || transaction.createdAt),
      })),
    [transactions]
  )

  if (transactions.length === 0) {
    return <p className="text-sm text-gray-500">No transfer requests yet.</p>
  }

  return (
    <div>
      <div className="space-y-3 md:hidden">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">
                {transaction.user.name || transaction.user.email}
              </p>
              <StatusBadge status={transaction.status} />
            </div>
                <div className="space-y-2 text-sm">
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
                  {transaction.status === "REJECTED" && transaction.adminRemark && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rejection Reason:</span>
                      <span className="text-red-600 text-right max-w-[200px]">{transaction.adminRemark}</span>
                    </div>
                  )}
                </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Inputter</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Payment Method</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Admin Remark</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
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
                  <StatusBadge status={transaction.status} />
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                  {transaction.status === "REJECTED" && transaction.adminRemark ? (
                    <span className="text-red-600 text-xs">{transaction.adminRemark}</span>
                  ) : transaction.status === "APPROVED" && transaction.adminRemark ? (
                    <span className="text-gray-600 text-xs">{transaction.adminRemark}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
