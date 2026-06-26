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
  memberName,
  budget,
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
  const [liveTotalAmountUsed, setLiveTotalAmountUsed] = useState(totalAmountUsed)
  const initialCategory = categories[0]?.name || ""
  const [rows, setRows] = useState<Array<{ id: string; category: string; description: string; amount: string }>>([
    { id: "row-1", category: initialCategory, description: "", amount: "" },
  ])

  function normalizeOptionalString(value: FormDataEntryValue | null) {
    if (typeof value !== "string") return undefined
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }

  useEffect(() => {
    setLiveTotalAmountUsed(totalAmountUsed)
  }, [totalAmountUsed])

  useEffect(() => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.category ? row : { ...row, category: initialCategory }
      )
    )
  }, [initialCategory])

  function addRow() {
    const rowId = `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setRows((currentRows) => [
      ...currentRows,
      { id: rowId, category: initialCategory, description: "", amount: "" },
    ])
  }

  function removeRow(id: string) {
    setRows((currentRows) => (currentRows.length === 1 ? currentRows : currentRows.filter((row) => row.id !== id)))
  }

  function updateRow(id: string, field: "category" | "description" | "amount", value: string) {
    setRows((currentRows) => currentRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const invalidRow = rows.find((row) => !row.category || !row.amount || Number.isNaN(Number(row.amount)) || Number(row.amount) <= 0)

    if (invalidRow) {
      setError("Please fill category and enter a valid amount for each row.")
      setLoading(false)
      return
    }

    const createdAmounts: number[] = []

    for (const row of rows) {
      const result = await createExpense({
        title: normalizeOptionalString(row.description),
        description: normalizeOptionalString(row.description),
        amount: Number(row.amount),
        category: row.category,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      createdAmounts.push(Number(row.amount))
    }

    const createdTotal = createdAmounts.reduce((sum, amount) => sum + amount, 0)

    setRows([{ id: "row-1", category: initialCategory, description: "", amount: "" }])
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
                  // Clear collection by navigating without params
                  router.push("/dashboard/expense-entry")
                }}
                className="text-purple-600 hover:text-purple-800 font-medium text-xs px-3 py-1 border border-purple-300 rounded hover:bg-purple-100 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            Add one or more expense rows, then submit them together.
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 gap-2 text-xs">
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[980px] sm:min-w-0">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-3 py-2 font-semibold w-12">Sr. No.</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold w-40">Amount (INR)</th>
                <th className="px-3 py-2 font-semibold w-24">Action</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="mb-4 block rounded-xl border border-gray-200 bg-white shadow-sm sm:mb-0 sm:table-row sm:rounded-none sm:border-t sm:border-gray-100 sm:shadow-none"
                >
                  <td className="flex items-center justify-between gap-3 px-3 py-2 text-gray-700 sm:table-cell sm:px-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:hidden">Sr. No.</span>
                    <span>{index + 1}</span>
                  </td>

                  <td className="flex flex-col gap-1 px-3 py-2 sm:table-cell sm:px-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:hidden">Category</span>
                    <Select
                      id={`category-${row.id}`}
                      name={`category-${row.id}`}
                      value={row.category}
                      onChange={(e) => updateRow(row.id, "category", e.target.value)}
                      required
                      className="h-10 w-full text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                  </td>

                  <td className="flex flex-col gap-1 px-3 py-2 sm:table-cell sm:px-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:hidden">Description</span>
                    <Textarea
                      id={`description-${row.id}`}
                      name={`description-${row.id}`}
                      value={row.description}
                      onChange={(e) => updateRow(row.id, "description", e.target.value)}
                      placeholder="Write description..."
                      rows={2}
                      className="min-h-[44px] text-sm"
                    />
                  </td>

                  <td className="flex flex-col gap-1 px-3 py-2 sm:table-cell sm:px-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:hidden">Amount (INR)</span>
                    <Input
                      id={`amount-${row.id}`}
                      name={`amount-${row.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                      required
                      className="h-10 w-full text-sm"
                    />
                  </td>

                  <td className="px-3 py-2 sm:table-cell sm:px-3">
                    <div className="flex justify-end sm:justify-start">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="h-9 gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-600">
            Rows: <span className="font-semibold">{rows.length}</span> | Total: <span className="font-semibold">{formatCurrency(liveTotalAmountUsed + rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0))}</span>
          </div>
          <Button type="submit" disabled={loading} className="h-9 text-sm sm:self-auto self-stretch">
            {loading ? "Saving..." : "Submit Expense"}
          </Button>
        </div>
      </form>
    </div>
  )
}

