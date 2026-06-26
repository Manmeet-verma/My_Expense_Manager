import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminStatementClient } from "@/components/admin-statement-client"

export default async function AdminStatementPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Statement</h1>
      </div>
      <AdminStatementClient userId={session.user.id} />
    </div>
  )
}
