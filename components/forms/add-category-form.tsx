"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCategory } from "@/actions/category"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type AddCategoryFormProps = {
  canCreate: boolean
}

export function AddCategoryForm({ canCreate }: AddCategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!canCreate) {
      setError("Only admins can create categories")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await createCategory({
      name: (formData.get("name") as string) || "",
      subHead: ((formData.get("subHead") as string) || "").trim() || undefined,
      description: ((formData.get("description") as string) || "").trim() || undefined,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess("Category created successfully")
    form.reset()
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input id="name" name="name" type="text" placeholder="e.g. Stationery" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subHead">Subhead</Label>
        <Input id="subHead" name="subHead" type="text" placeholder="e.g. Office Supplies" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" name="description" type="text" placeholder="Short note about this category" />
      </div>

      <Button type="submit" disabled={!canCreate || loading} className="w-full">
        {loading ? "Creating..." : "Create Category"}
      </Button>
    </form>
  )
}
