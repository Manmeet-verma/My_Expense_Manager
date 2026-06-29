"use client"

import { useCallback } from "react"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react"

interface StatsCardsProps {
  mode?: "member" | "admin"
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
    paid?: number
    pendingAmount?: number
    rejectedAmount?: number
    totalApprovedAmount: number
    totalPaidAmount?: number
    collectionAmount?: number
    totalBudget?: number
    submittedAmount?: number
    remainingBudget?: number
  }
}

export function StatsCards({ stats, mode = "member", activeStatus, onSelectStatus }: StatsCardsProps & { activeStatus?: string; onSelectStatus?: (s: string) => void }) {
  const totalExpenseAmount = stats.submittedAmount ?? 0
  const collectionAmount = stats.collectionAmount ?? stats.totalBudget ?? 0
  const remainingCollection = collectionAmount - totalExpenseAmount

  const openingBalance = stats.totalBudget ?? 0
  const totalExpenseRequested = stats.submittedAmount ?? 0
  const rejectedFund = stats.rejectedAmount ?? 0
  const verifiedFund = stats.totalApprovedAmount ?? 0
  const approvedFund = stats.totalApprovedAmount ?? 0
  const totalFundReceived = stats.collectionAmount ?? 0
  const totalFundPaid = stats.totalPaidAmount ?? 0
  const unapprovedFund = Math.max(0, openingBalance - totalExpenseRequested)
  const balanceReceivable = Math.max(0, openingBalance - totalExpenseRequested - totalFundReceived)
  const closingBalance = openingBalance + totalFundReceived - totalFundPaid

  const memberCards = [
    {
      title: "Opening Balance",
      value: formatCurrency(openingBalance),
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Expense Requested",
      value: formatCurrency(totalExpenseRequested),
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Rejected Fund",
      value: formatCurrency(rejectedFund),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Verified Fund",
      value: formatCurrency(verifiedFund),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Approved Fund",
      value: formatCurrency(approvedFund),
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Unverified / Unapproved Fund",
      value: formatCurrency(unapprovedFund),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total Fund Received",
      value: formatCurrency(totalFundReceived),
      icon: DollarSign,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Total Fund Paid",
      value: formatCurrency(totalFundPaid),
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Balance Receivable",
      value: formatCurrency(balanceReceivable),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Closing Balance",
      value: formatCurrency(closingBalance),
      icon: DollarSign,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ]

  const adminCards = [
    {
      title: "Total Expense",
      value: formatCurrency(totalExpenseAmount),
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Approved Expense",
      value: formatCurrency(stats.totalApprovedAmount),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Mark Paid Expense",
      value: formatCurrency(stats.totalPaidAmount ?? 0),
      icon: DollarSign,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Approved Expense",
      value: formatCurrency(stats.totalApprovedAmount),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Paid Expense",
      value: formatCurrency(stats.totalPaidAmount ?? 0),
      icon: DollarSign,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Rejected Expense",
      value: formatCurrency(stats.rejectedAmount ?? 0),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Pending Expense",
      value: formatCurrency(stats.pendingAmount ?? 0),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ]

  const cards = mode === "admin" ? adminCards : memberCards
  const gridClass =
    mode === "admin"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
  const handleClick = useCallback(
    (title: string) => {
      if (!onSelectStatus) return
      const mapping: Record<string, string> = {
        "Total Fund Received": "COLLECTION",
        "Approved Fund": "APPROVED",
        "Rejected Fund": "REJECTED",
        "Unverified / Unapproved Fund": "PENDING",
        "Total Fund Paid": "PAID",
      }
      const mapped = mapping[title] || "ALL"
      if (activeStatus === mapped) {
        onSelectStatus("ALL")
      } else {
        onSelectStatus(mapped)
      }
    },
    [onSelectStatus, activeStatus]
  )

  return (
    <div className={gridClass}>
      {cards.map((card) => {
        const mapped = {
          "Total Fund Received": "COLLECTION",
          "Approved Fund": "APPROVED",
          "Rejected Fund": "REJECTED",
          "Unverified / Unapproved Fund": "PENDING",
          "Total Fund Paid": "PAID",
        }[card.title] || "ALL"
        const isActive = activeStatus === mapped
        return (
          <Card key={card.title} onClick={() => handleClick(card.title)} className={`${isActive ? "ring-2 ring-offset-1 ring-blue-300" : ""} cursor-pointer`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs text-gray-500 sm:text-sm">{card.title}</p>
                  <p className="mt-1 text-lg font-bold leading-tight text-gray-900 sm:text-2xl">{card.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
