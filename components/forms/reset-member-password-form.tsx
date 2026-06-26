"use client"

import { useState } from "react"
import { adminResetMemberPassword } from "@/actions/auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"

type Member = {
  id: string
  name: string | null
  email: string
}

interface ResetMemberPasswordFormProps {
  members: Member[]
}

export function ResetMemberPasswordForm({ members }: ResetMemberPasswordFormProps) {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const email = selectedEmail || (formData.get("email") as string)
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!email) {
      setError("Please select an inputter or enter an email")
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match")
      setLoading(false)
      return
    }

    const result = await adminResetMemberPassword({ email, newPassword })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    form.reset()
    setSelectedEmail("")
    setSuccess("Inputter password reset successfully")
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Inputter Password</CardTitle>
        <CardDescription>Admin and verifier access: reset an inputter account password</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          <div className="space-y-2">
            <Label htmlFor="memberSelect">Select Inputter</Label>
            <Select
              id="memberSelect"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
            >
              <option value="">-- Select an inputter --</option>
              {members.map((member) => (
                <option key={member.id} value={member.email}>
                  {member.name || member.email} ({member.email})
                </option>
              ))}
            </Select>
          </div>

          <div className="relative flex items-center justify-center">
            <span className="bg-white px-2 text-sm text-gray-500 z-10">or</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Enter Email Manually</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="inputter@example.com"
              value={selectedEmail ? "" : ""}
              onChange={() => {}}
              disabled={!!selectedEmail}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                className="pr-10"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="pr-10"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
