"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createAdmin } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, X } from "lucide-react"

interface CreateAdminFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateAdminForm({ onSuccess, onCancel }: CreateAdminFormProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      fatherName: formData.get("fatherName") as string,
      aadhaarNo: formData.get("aadhaarNo") as string,
      password: formData.get("password") as string,
    }

    const result = await createAdmin(data)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      form.reset()
      router.refresh()
      setLoading(false)
      onSuccess?.()
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Create Admin Account</CardTitle>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <CardDescription>Create a new admin account</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="admin-name">Full Name</Label>
            <Input
              id="admin-name"
              name="name"
              type="text"
              placeholder="Admin Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-father-name">Father&apos;s Name</Label>
            <Input
              id="admin-father-name"
              name="fatherName"
              type="text"
              placeholder="Father&apos;s Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-aadhaar">Aadhaar No.</Label>
            <Input
              id="admin-aadhaar"
              name="aadhaarNo"
              type="text"
              inputMode="numeric"
              maxLength={12}
              placeholder="12-digit Aadhaar number"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="pr-10"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create Admin"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  )
}
