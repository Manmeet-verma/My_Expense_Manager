"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, X } from "lucide-react"

interface DeleteExpenseConfirmProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  expenseTitle: string
  isLoading?: boolean
}

export function DeleteExpenseConfirm({ 
  isOpen, 
  onClose, 
  onConfirm, 
  expenseTitle,
  isLoading = false 
}: DeleteExpenseConfirmProps) {
  if (!isOpen) return null

  async function handleConfirm() {
    await onConfirm()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Expense?
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete &quot;{expenseTitle}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
