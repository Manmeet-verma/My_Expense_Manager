"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { updateAccount } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface EditAccountFormProps {
  account: {
    id: string
    name: string | null
    email: string
    fatherName: string | null
    aadhaarNo: string | null
    roleLabel: string
  }
  onCancel: () => void
  onSuccess?: () => void
}

export function EditAccountForm({ account, onCancel, onSuccess }: EditAccountFormProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: account.name || "",
    email: account.email || "",
    fatherName: account.fatherName || "",
    aadhaarNo: account.aadhaarNo || "",
    newPassword: "",
  })

  useEffect(() => {
    setFormData({
      name: account.name || "",
      email: account.email || "",
      fatherName: account.fatherName || "",
      aadhaarNo: account.aadhaarNo || "",
      newPassword: "",
    })
  }, [account])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await updateAccount({
      userId: account.id,
      name: formData.name,
      email: formData.email,
      fatherName: formData.fatherName,
      aadhaarNo: formData.aadhaarNo,
      newPassword: formData.newPassword,
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
      <Card className="w-full max-w-xl shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold">Edit {account.roleLabel} Account</CardTitle>
              <CardDescription>Update account details or set a new password.</CardDescription>
            </div>
            <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {error && <div className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-father-name">Father&apos;s Name</Label>
              <Input
                id="edit-father-name"
                value={formData.fatherName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fatherName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-aadhaar">Aadhaar No.</Label>
              <Input
                id="edit-aadhaar"
                inputMode="numeric"
                maxLength={12}
                value={formData.aadhaarNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, aadhaarNo: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={formData.newPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                autoComplete="new-password"
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
