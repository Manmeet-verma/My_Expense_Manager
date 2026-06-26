"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { updateCategory } from "@/actions/category"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface EditCategoryFormProps {
  category: {
    id: string
    name: string
    subHead: string | null
    description: string | null
  }
  onCancel: () => void
  onSuccess?: () => void
}

export function EditCategoryForm({ category, onCancel, onSuccess }: EditCategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: category.name,
    subHead: category.subHead || "",
    description: category.description || "",
  })

  useEffect(() => {
    setFormData({
      name: category.name,
      subHead: category.subHead || "",
      description: category.description || "",
    })
  }, [category])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await updateCategory({
      categoryId: category.id,
      name: formData.name,
      subHead: formData.subHead,
      description: formData.description,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
    onSuccess?.()
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold">Edit Category</CardTitle>
              <CardDescription>Update the category name, subhead, or description.</CardDescription>
            </div>
            <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-subhead">Subhead</Label>
              <Input
                id="edit-category-subhead"
                value={formData.subHead}
                onChange={(e) => setFormData((prev) => ({ ...prev, subHead: e.target.value }))}
                placeholder="Optional subhead"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Input
                id="edit-category-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </CardContent>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
