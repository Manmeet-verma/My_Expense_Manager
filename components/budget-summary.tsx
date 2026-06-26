"use client"

import { formatCurrency } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface BudgetSummaryProps {
  totalBudget: number
  submittedAmount: number
  remainingBudget: number
}

export function BudgetSummary({ totalBudget, submittedAmount, remainingBudget }: BudgetSummaryProps) {
  const percentageUsed = Math.round((submittedAmount / totalBudget) * 100)
  const isOverBudget = remainingBudget < 0

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">Budget Summary</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(remainingBudget)}</p>
          <p className="text-xs text-blue-700">Remaining</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-blue-800 font-medium">
            {formatCurrency(submittedAmount)}
          </span>
          <span className="text-sm text-blue-800 font-medium">
            {formatCurrency(totalBudget)}
          </span>
        </div>
        <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isOverBudget ? "bg-red-500" : percentageUsed > 80 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-2">
          {percentageUsed}% of budget used {isOverBudget && "⚠️ Over budget!"}
        </p>
      </div>

      {/* Summary rows */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-blue-800">
          <span>Total Budget:</span>
          <span className="font-semibold">{formatCurrency(totalBudget)}</span>
        </div>
        <div className="flex justify-between text-blue-800">
          <span>Submitted Expenses:</span>
          <span className="font-semibold">{formatCurrency(submittedAmount)}</span>
        </div>
        <div className={`flex justify-between font-semibold ${isOverBudget ? "text-red-700" : "text-green-700"}`}>
          <span>Remaining Budget:</span>
          <span>{formatCurrency(Math.max(0, remainingBudget))}</span>
        </div>
      </div>
    </Card>
  )
}
