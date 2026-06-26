"use client"

import { useState } from "react"
import { AddCategoryForm } from "@/components/forms/add-category-form"
import { Button } from "@/components/ui/button"

type CreateCategorySectionProps = {
  canCreate: boolean
}

export function CreateCategorySection({ canCreate }: CreateCategorySectionProps) {
  const [open, setOpen] = useState(false)

  if (!canCreate) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-gray-900">Create New Category</h2>
        <p className="mt-1 text-sm text-gray-600">Only admins can create categories.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Create New Category</h2>
          <p className="mt-1 text-sm text-gray-600">Click the button to open the create category form.</p>
        </div>

        {!open && (
          <Button type="button" onClick={() => setOpen(true)}>
            Create Category
          </Button>
        )}
      </div>

      {open && (
        <div>
          <AddCategoryForm canCreate={canCreate} />
          <div className="mt-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Close Form
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
