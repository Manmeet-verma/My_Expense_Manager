"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { updateAccount } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Smartphone, Building2, X } from "lucide-react"

interface EditAccountFormProps {
  account: {
    id: string
    name: string | null
    email: string
    fatherName: string | null
    aadhaarNo: string | null
    upiId?: string | null
    accountNumber?: string | null
    roleLabel: string
  }
  onCancel: () => void
  onSuccess?: () => void
}

export function EditAccountForm({ account, onCancel, onSuccess }: EditAccountFormProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(account.name || "")
  const [email, setEmail] = useState(account.email || "")
  const [fatherName, setFatherName] = useState(account.fatherName || "")
  const [aadhaarNo, setAadhaarNo] = useState(account.aadhaarNo || "")
  const [upiId, setUpiId] = useState(account.upiId || "")
  const [accountNumber, setAccountNumber] = useState(account.accountNumber || "")
  const [newPassword, setNewPassword] = useState("")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await updateAccount({
      userId: account.id,
      name,
      email,
      fatherName,
      aadhaarNo,
      upiId,
      accountNumber,
      newPassword,
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-father-name">Father&apos;s Name</Label>
              <Input
                id="edit-father-name"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-aadhaar">Aadhaar No.</Label>
              <Input
                id="edit-aadhaar"
                inputMode="numeric"
                maxLength={12}
                value={aadhaarNo}
                onChange={(e) => setAadhaarNo(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-upi" className="flex items-center gap-1">
                <Smartphone className="h-4 w-4" /> GPay / UPI
              </Label>
              <Input
                id="edit-upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. name@upi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-account" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Bank Account
              </Label>
              <Input
                id="edit-account"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 1234567890"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
