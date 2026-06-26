"use client"

import { useState } from "react"
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

export default function DashboardMemberView({ stats, expenses, funds, site }: Props) {
  const [activeStatus, setActiveStatus] = useState<MemberDashboardStatus>("ALL")

  const handleSelectStatus = (status: string) => {
    setActiveStatus(status as MemberDashboardStatus)
  }

  return (
    <div>
      {stats && (
        <StatsCards 
          mode="member" 
          stats={stats} 
          activeStatus={activeStatus} 
          onSelectStatus={handleSelectStatus}
        />
      )}
      <div className="mt-6">
        <MemberDashboardStatusTable 
          site={site} 
          expenses={expenses} 
          funds={funds}
          activeStatus={activeStatus} 
          onStatusChange={handleSelectStatus}
        />
      </div>
    </div>
  )
}
