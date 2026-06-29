"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createExpense } from "@/actions/expense"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import { broadcastExpenseChange } from "@/lib/supabase/realtime"
import { CheckCircle, Plus, Trash2 } from "lucide-react"


interface EnhancedExpenseFormProps {
  memberName?: string
  budget?: number
  totalAmountUsed: number
  categories: Array<{
    id: string
    name: string
    description: string | null
  }>
  onSuccess?: () => void
  collectionId?: string
  collectionAmount?: number
  collectionFrom?: string
}
export function EnhancedExpenseForm({
  totalAmountUsed,
  categories,
  onSuccess,
  collectionId,
  collectionAmount,
  collectionFrom
}: EnhancedExpenseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [categoryFields, setCategoryFields] = useState<Record<string, { description: string; amount: string }>>(
    () => Object.fromEntries(categories.map((c) => [c.name, { description: "", amount: "" }]))
  )
  const [liveTotalAmountUsed, setLiveTotalAmountUsed] = useState(totalAmountUsed)

  const totalFormAmount = Object.values(categoryFields).reduce((sum, field) => sum + (Number(field.amount) || 0), 0)

  useEffect(() => {
    setLiveTotalAmountUsed(totalAmountUsed)
  }, [totalAmountUsed])

  function updateCategoryField(category: string, field: "description" | "amount", value: string) {
    setCategoryFields((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const nonEmptyFields = Object.entries(categoryFields).filter(([, field]) => field.amount && Number(field.amount) > 0)

    if (nonEmptyFields.length === 0) {
      setError("Please enter at least one expense amount.")
      setLoading(false)
      return
    }

    const createdAmounts: number[] = []

    for (const [category, field] of nonEmptyFields) {
      const description = field.description.trim() || undefined
      const result = await createExpense({
        title: description,
        description,
        amount: Number(field.amount),
        category,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      createdAmounts.push(Number(field.amount))
    }

    const createdTotal = createdAmounts.reduce((sum, amount) => sum + amount, 0)

    setCategoryFields(Object.fromEntries(categories.map((c) => [c.name, { description: "", amount: "" }])))
    setLiveTotalAmountUsed((prev) => prev + createdTotal)
    void broadcastExpenseChange("member-create")
    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.refresh()
      if (onSuccess) onSuccess()
      setSuccess(false)
    }, 1500)
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-green-600 font-medium">Expense added successfully!</p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="w-full">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-3">
            {error}
          </div>
        )}

        {collectionId && collectionAmount && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-800">Collection Selected</p>
                <p className="text-sm text-purple-900 font-semibold mt-1">{collectionFrom}</p>
                <p className="text-xs text-purple-700 mt-1">Amount: {formatCurrency(collectionAmount)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  router.push("/dashboard/expense-entry")
                }}
                className="text-purple-600 hover:text-purple-800 font-medium text-xs px-3 py-1 border border-purple-300 rounded hover:bg-purple-100 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="mb-2 text-xs text-gray-600">
          Enter expenses for each category below.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px] sm:min-w-0">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold w-44">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {categories.map((cat) => {
                const field = categoryFields[cat.name] || { description: "", amount: "" }
                return (
                  <tr
                    key={cat.id}
                    className="mb-3 block rounded-xl border border-gray-200 bg-white shadow-sm sm:mb-0 sm:table-row sm:rounded-none sm:border-t sm:border-gray-100 sm:shadow-none"
                  >
                    <td className="flex flex-col gap-1 px-3 py-2 sm:table-cell sm:px-3 sm:w-48">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:hidden">Category</span>
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </td>

                    <td className="flex flex-col gap-1 px-3 py-2 sm:table-cell sm:px-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:hidden">Description</span>
                      <Textarea
                        id={`desc-${cat.id}`}
                        value={field.description}
                        onChange={(e) => updateCategoryField(cat.name, "description", e.target.value)}
                        placeholder="Write description..."
                        rows={1}
                        className="min-h-[38px] text-sm"
                      />
                    </td>

                    <td className="flex flex-col gap-1 px-3 py-2 sm:table-cell sm:px-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:hidden">Amount (INR)</span>
                      <Input
                        id={`amt-${cat.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.amount}
                        onChange={(e) => updateCategoryField(cat.name, "amount", e.target.value)}
                        className="h-10 w-full text-sm"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-600">
            Categories: <span className="font-semibold">{Object.values(categoryFields).filter((f) => f.amount && Number(f.amount) > 0).length}</span> | Total: <span className="font-semibold">{formatCurrency(liveTotalAmountUsed + totalFormAmount)}</span>
          </div>
          <Button type="submit" disabled={loading} className="h-9 text-sm sm:self-auto self-stretch">
            {loading ? "Saving..." : "Submit Expense"}
          </Button>
        </div>
      </form>
    </div>
  )
}

