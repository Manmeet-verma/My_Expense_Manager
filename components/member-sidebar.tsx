'use client'

import { useEffect, useState } from "react"
import { getExpenseStats } from "@/actions/expense"
import { TrendingUp, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function MemberSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<{
    total: number
    submittedAmount: number
    totalBudget: number
    pending: number
    approved: number
    rejected: number
    paid: number
    totalApprovedAmount: number
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
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
                      <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
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
    { title: "Total Expense", value: formatCurrency(stats.submittedAmount), icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Collection", value: formatCurrency(stats.totalBudget || 0), icon: Wallet, color: "text-teal-600", bgColor: "bg-teal-50" },
  ]

  return (
    <>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed md:static inset-y-0 left-0 z-50 w-52 md:w-64 bg-white border-r border-gray-200 shadow-lg animate-slide-in">
            <div className="sticky top-16 p-3">
              <div className="flex flex-col gap-3">
                {cards.map((card) => (
                  <div key={card.title} className={`${card.bgColor} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                      <span className="text-xs font-medium text-gray-600">{card.title}</span>
                    </div>
                    <p className="text-base font-bold text-gray-900">{card.value}</p>
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
