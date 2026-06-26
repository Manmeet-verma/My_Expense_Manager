"use client"

import { useState } from "react"
import { updateUserBudget } from "@/actions/expense"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { PencilIcon, CheckIcon, XIcon } from "lucide-react"

interface BudgetOverviewProps {
  memberName: string
  totalBudget: number
  submittedAmount: number
}

export function BudgetOverview({ memberName, totalBudget, submittedAmount }: BudgetOverviewProps) {
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetEditValue, setBudgetEditValue] = useState(totalBudget.toString())
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [budgetError, setBudgetError] = useState("")

  const remainingBudget = totalBudget - submittedAmount

  async function handleBudgetUpdate() {
    setBudgetLoading(true)
    setBudgetError("")
    const newBudget = parseFloat(budgetEditValue)

    if (isNaN(newBudget) || newBudget < 0) {
      setBudgetError("Budget must be 0 or greater")
      setBudgetLoading(false)
      return
    }

    const result = await updateUserBudget(newBudget)

    if (result?.error) {
      setBudgetError(result.error)
      setBudgetLoading(false)
    } else {
      setEditingBudget(false)
      setBudgetLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-blue-900">Opening Balance</CardTitle>
        {!editingBudget && (
          <button
            onClick={() => setEditingBudget(true)}
            className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition"
            title="Edit budget"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {budgetError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {budgetError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700 mb-1">Inputter Name</p>
            <p className="text-lg font-semibold text-blue-900">{memberName}</p>
          </div>

          {/* Editable Total Budget */}
          <div>
            {editingBudget ? (
              <div className="space-y-2">
                <p className="text-sm text-blue-700">Total Budget</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={budgetEditValue}
                    onChange={(e) => setBudgetEditValue(e.target.value)}
                    step="0.01"
                    min="0"
                    className="p-1 h-8 text-sm"
                  />
                  <button
                    onClick={handleBudgetUpdate}
                    disabled={budgetLoading}
                    className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                    title="Save"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingBudget(false)
                      setBudgetEditValue(totalBudget.toString())
                      setBudgetError("")
                    }}
                    disabled={budgetLoading}
                    className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
                    title="Cancel"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Budget</p>
                <p className="text-lg font-semibold text-blue-900">{formatCurrency(totalBudget)}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-blue-700 mb-1">Submitted Expenses</p>
            <p className="text-lg font-semibold text-blue-900">{formatCurrency(submittedAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 mb-1">Remaining Budget</p>
            <p className={`text-lg font-semibold ${remainingBudget >= 0 ? "text-green-700" : "text-red-700"}`}>
              {formatCurrency(remainingBudget)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
