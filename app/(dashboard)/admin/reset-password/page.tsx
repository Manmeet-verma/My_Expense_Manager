import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMembers } from "@/actions/auth"
import { ResetMemberPasswordForm } from "@/components/forms/reset-member-password-form"

type MemberRow = {
  id: string
  name: string | null
  email: string
}

export default async function AdminResetPasswordPage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Reset password page auth error:", error)
    redirect("/login")
  }

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  let members: MemberRow[] = []
  try {
    members = (await getMembers()) || []
  } catch (error) {
    console.error("Get members error:", error)
    members = []
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reset Inputter Password</h1>
        <p className="mt-1 text-gray-600">Admin access only</p>
      </div>
      <ResetMemberPasswordForm members={members} />
    </div>
  )
}
