"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupervisor } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Smartphone, Building2 } from "lucide-react"

export function CreateSupervisorForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      fatherName: formData.get("fatherName") as string,
      aadhaarNo: formData.get("aadhaarNo") as string,
      password: formData.get("password") as string,
      upiId: formData.get("upiId") as string || undefined,
      accountNumber: formData.get("accountNumber") as string || undefined,
    }

    const result = await createSupervisor(data)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    form.reset()
    setSuccess("Verifier account created successfully")
    setLoading(false)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Verifier Account</CardTitle>
        <CardDescription>Admin only: create a verifier login account</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="supervisor-name">Full Name</Label>
            <Input
              id="supervisor-name"
              name="name"
              type="text"
              placeholder="Verifier Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supervisor-email">Email</Label>
            <Input
              id="supervisor-email"
              name="email"
              type="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supervisor-father-name">Father&apos;s Name</Label>
            <Input
              id="supervisor-father-name"
              name="fatherName"
              type="text"
              placeholder="Father&apos;s Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supervisor-aadhaar">Aadhaar No.</Label>
            <Input
              id="supervisor-aadhaar"
              name="aadhaarNo"
              type="text"
              inputMode="numeric"
              maxLength={12}
              placeholder="12-digit Aadhaar number"
              required
            />
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-3">Payment Details (Optional)</p>

            <div className="space-y-2 mb-3">
              <Label htmlFor="supervisor-upi-id" className="flex items-center gap-1">
                <Smartphone className="h-4 w-4" /> GPay / UPI ID
              </Label>
              <Input
                id="supervisor-upi-id"
                name="upiId"
                type="text"
                placeholder="e.g. name@upi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supervisor-account-number" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Bank Account Number
              </Label>
              <Input
                id="supervisor-account-number"
                name="accountNumber"
                type="text"
                placeholder="Enter bank account number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisor-password">Password</Label>
            <div className="relative">
              <Input
                id="supervisor-password"
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Verifier"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
