"use client"

import { useMemo, useState } from "react"
import { StatsCards } from "@/components/stats-cards"
import { MemberDashboardStatusTable } from "@/components/member-dashboard-status-table"

interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  status: "APPROVED" | "REJECTED" | "PENDING" | "PAID"
  createdAt: Date
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

type MemberDashboardStatus = "ALL" | "APPROVED" | "REJECTED" | "PENDING" | "PAID" | "COLLECTION"

interface MemberStats {
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

interface Props {
  stats: MemberStats | null
  expenses: Expense[]
  funds: Fund[]
  site: string
}

function getTodayString() {
  const d = new Date()
  return d.toISOString().split("T")[0]
}

export default function DashboardMemberView({ stats, expenses, funds, site }: Props) {
  const [activeStatus, setActiveStatus] = useState<MemberDashboardStatus>("ALL")
  const [fromDate, setFromDate] = useState(getTodayString)
  const [toDate, setToDate] = useState(getTodayString)

  const handleSelectStatus = (status: string) => {
    setActiveStatus(status as MemberDashboardStatus)
  }

  const filteredExpenses = useMemo(() => {
    if (!fromDate && !toDate) return expenses
    return expenses.filter((exp) => {
      const d = new Date(exp.createdAt)
      const fromOk = !fromDate || d >= new Date(`${fromDate}T00:00:00`)
      const toOk = !toDate || d <= new Date(`${toDate}T23:59:59`)
      return fromOk && toOk
    })
  }, [expenses, fromDate, toDate])

  const filteredFunds = useMemo(() => {
    if (!fromDate && !toDate) return funds
    return funds.filter((f) => {
      const d = new Date(f.fundDate)
      const fromOk = !fromDate || d >= new Date(`${fromDate}T00:00:00`)
      const toOk = !toDate || d <= new Date(`${toDate}T23:59:59`)
      return fromOk && toOk
    })
  }, [funds, fromDate, toDate])

  const computedStats = useMemo(() => {
    const total = filteredExpenses.length
    const pendingAmount = filteredExpenses.filter((e) => e.status === "PENDING").reduce((s, e) => s + e.amount, 0)
    const rejectedAmount = filteredExpenses.filter((e) => e.status === "REJECTED").reduce((s, e) => s + e.amount, 0)
    const totalApprovedAmount = filteredExpenses.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0)
    const totalPaidAmount = filteredExpenses.filter((e) => e.status === "PAID").reduce((s, e) => s + e.amount, 0)
    const submittedAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0)
    const collectionAmount = filteredFunds.reduce((s, f) => s + f.amount, 0)

    return {
      total,
      pending: filteredExpenses.filter((e) => e.status === "PENDING").length,
      approved: filteredExpenses.filter((e) => e.status === "APPROVED").length,
      rejected: filteredExpenses.filter((e) => e.status === "REJECTED").length,
      paid: filteredExpenses.filter((e) => e.status === "PAID").length,
      pendingAmount,
      rejectedAmount,
      totalApprovedAmount,
      totalPaidAmount,
      collectionAmount,
      totalBudget: stats?.totalBudget ?? 0,
      submittedAmount,
      remainingBudget: (stats?.totalBudget ?? 0) - submittedAmount,
    }
  }, [filteredExpenses, filteredFunds, stats])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 whitespace-nowrap">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 rounded-md border border-gray-300 px-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 whitespace-nowrap">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 rounded-md border border-gray-300 px-2 text-sm"
          />
        </div>
      </div>

      <StatsCards
        mode="member"
        stats={computedStats}
        activeStatus={activeStatus}
        onSelectStatus={handleSelectStatus}
      />

      <div className="mt-6">
        <MemberDashboardStatusTable
          site={site}
          expenses={filteredExpenses}
          funds={filteredFunds}
          activeStatus={activeStatus}
          onStatusChange={handleSelectStatus}
        />
      </div>
    </div>
  )
}
