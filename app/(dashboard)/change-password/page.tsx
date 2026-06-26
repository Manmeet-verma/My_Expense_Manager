import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ChangePasswordForm } from "@/components/forms/change-password-form"

export default async function ChangePasswordPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="mt-1 text-gray-600">Update your account password</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
