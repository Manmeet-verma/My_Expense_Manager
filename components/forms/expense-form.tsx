"use client"

import { useState } from "react"
import { createExpense, updateExpense } from "@/actions/expense"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface ExpenseFormProps {
  expense?: {
    id: string
    title: string
    description: string | null
    amount: number
    category: string
  }
  categories?: Array<{
    id: string
    name: string
    description: string | null
  }>
  onSuccess?: () => void
}

export function ExpenseForm({ expense, categories = [], onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function normalizeOptionalString(value: FormDataEntryValue | null) {
    if (typeof value !== "string") return undefined
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      title: normalizeOptionalString(formData.get("title")),
      description: normalizeOptionalString(formData.get("description")),
      amount: parseFloat(formData.get("amount") as string),
      category: formData.get("category") as string,
    }

    let result
    if (expense) {
      result = await updateExpense(expense.id, data)
    } else {
      result = await createExpense(data)
    }

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      if (onSuccess) onSuccess()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{expense ? "Edit Expense" : "Create New Expense"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Expense title"
              defaultValue={expense?.title}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add details about this expense..."
              defaultValue={expense?.description || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
                placeholder="₹0.00"
              defaultValue={expense?.amount}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              id="category" 
              name="category" 
              defaultValue={expense?.category || "OTHER"}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : expense ? "Update Expense" : "Create Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
