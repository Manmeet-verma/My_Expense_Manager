"use client"

import { useState } from "react"
import { getCategoryMemberExpenses } from "@/actions/category"
import { deleteCategory } from "@/actions/category"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ExportExcelButton } from "@/components/export-excel-button"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { EditCategoryForm } from "@/components/forms/edit-category-form"

type Category = {
  id: string
  name: string
  subHead: string | null
  description: string | null
  memberCount: number
  expenseCount: number
  totalAmount: number
}

type CategoryMemberExpense = {
  id: string
  memberName: string
  description: string | null
  amount: number
  createdAt: Date
}

interface AdminCategoryUsageSectionProps {
  categories: Category[]
  canManage?: boolean
}

export function AdminCategoryUsageSection({ categories, canManage = false }: AdminCategoryUsageSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [memberExpenses, setMemberExpenses] = useState<CategoryMemberExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const categoryExportData = categories.map((category, index) => ({
    "Sr No": index + 1,
    Category: category.name,
    Subhead: category.subHead || "-",
    Description: category.description || "-",
    "Inputters Used": category.memberCount,
    "Expense Count": category.expenseCount,
    "Total Expense": category.totalAmount,
  }))

  const selectedCategoryExportData = memberExpenses.map((expense, index) => ({
    "Sr No": index + 1,
    Category: selectedCategory || "",
    "Inputter Name": expense.memberName,
    Description: expense.description || "-",
    Amount: expense.amount,
    Date: formatDate(expense.createdAt),
  }))

  async function handleCategoryClick(categoryName: string) {
    setSelectedCategory(categoryName)
    setLoading(true)
    setError("")

    const result = await getCategoryMemberExpenses({ categoryName })

    if (result.error) {
      setError(result.error)
      setMemberExpenses([])
      setLoading(false)
      return
    }

    setMemberExpenses(result.data)
    setLoading(false)
  }

  async function handleDelete(category: Category) {
    if (!canManage) return

    const confirmed = window.confirm(`Delete category \"${category.name}\"?`)
    if (!confirmed) return

    setDeletingId(category.id)
    const result = await deleteCategory({ categoryId: category.id })

    if (result?.error) {
      setError(result.error)
      setDeletingId(null)
      return
    }

    if (selectedCategory === category.name) {
      setSelectedCategory(null)
      setMemberExpenses([])
      setError("")
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      {editingCategory && (
        <EditCategoryForm
          category={{
            id: editingCategory.id,
            name: editingCategory.name,
            subHead: editingCategory.subHead ?? null,
            description: editingCategory.description,
          }}
          onCancel={() => setEditingCategory(null)}
          onSuccess={() => setEditingCategory(null)}
        />
      )}

      <div className="flex justify-end">
        <ExportExcelButton
          data={categoryExportData}
          fileName="category-usage-summary"
          sheetName="CategoryUsage"
          label="Export Category Excel"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-[760px] w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Subhead</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Inputters Used</th>
              <th className="px-4 py-3 font-semibold">Expense Count</th>
              <th className="px-4 py-3 font-semibold">Total Expense</th>
              {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-gray-500">
                  No categories added yet
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedCategory === category.name ? "bg-red-50" : ""
                  }`}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{category.name}</td>
                  <td className="px-4 py-3 text-gray-700">{category.subHead || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{category.description || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{category.memberCount}</td>
                  <td className="px-4 py-3 text-gray-700">{category.expenseCount}</td>
                  <td className="px-4 py-3 text-gray-900">{formatCurrency(category.totalAmount)}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(category)}
                          disabled={deletingId === category.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          {deletingId === category.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCategory && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">
              Inputters Using Category: {selectedCategory}
            </h3>
            <ExportExcelButton
              data={selectedCategoryExportData}
              fileName={`category-${selectedCategory}-details`}
              sheetName="CategoryDetails"
              label="Export Details"
            />
          </div>

          <div className="p-4">
            {error && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
            ) : memberExpenses.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No inputter expenses found for this category
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Inputter Name</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">Credit</th>
                      <th className="px-4 py-3 font-semibold">Debit</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberExpenses.map((expense) => (
                      <tr key={expense.id} className="border-t border-gray-100 odd:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{expense.memberName}</td>
                        <td className="px-4 py-3 text-gray-700">{expense.description || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">-</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(expense.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
