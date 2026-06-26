'use client'

import { useEffect, useState } from "react"
import { getExpenseStats } from "@/actions/expense"
import { TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<{
    total: number
    submittedAmount: number
    totalBudget: number
    pending: number
    approved: number
    rejected: number
    paid: number
    pendingAmount: number
    rejectedAmount: number
    totalApprovedAmount: number
    totalPaidAmount: number
    collectionAmount: number
  } | null>(null)

  useEffect(() => {
    getExpenseStats().then(setStats)
  }, [])

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev)
    window.addEventListener("toggle-mobile-sidebar", handleToggle as EventListener)
    return () => window.removeEventListener("toggle-mobile-sidebar", handleToggle as EventListener)
  }, [])

  if (!stats) {
    return (
      <>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsOpen(false)}
            />
            <aside className="fixed md:static inset-y-0 left-0 z-50 w-40 md:w-48 bg-white border-r border-gray-200 shadow-lg">
              <div className="sticky top-16 p-2">
                <div className="flex flex-col gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded p-2 animate-pulse">
                      <div className="h-2 w-12 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </>
        )}
      </>
    )
  }

  const cards = [
    { title: "Total Received Amount", value: formatCurrency(stats.collectionAmount ?? 0), icon: DollarSign, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Total Rejected Exp. - Req.", value: formatCurrency(stats.pendingAmount ?? 0), icon: Clock, color: "text-red-700", bgColor: "bg-red-50" },
    { title: "Total Approved Exp. - Payable", value: formatCurrency(stats.totalApprovedAmount), icon: CheckCircle, color: "text-yellow-700", bgColor: "bg-yellow-50" },
    { title: "Total Approved Exp. - Paid", value: formatCurrency(stats.totalPaidAmount ?? 0), icon: TrendingUp, color: "text-green-700", bgColor: "bg-green-50" },
    { title: "Rejected Amount", value: formatCurrency(stats.rejectedAmount ?? 0), icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
  ]

  return (
    <>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed md:static inset-y-0 left-0 z-50 w-40 md:w-48 bg-white border-r border-gray-200 shadow-lg animate-slide-in">
            <div className="sticky top-16 p-2">
              <div className="flex flex-col gap-1">
                {cards.map((card) => (
                  <div key={card.title} className={`${card.bgColor} rounded p-2`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <card.icon className={`h-3 w-3 ${card.color}`} />
                      <span className="text-[10px] font-medium text-gray-600">{card.title}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
