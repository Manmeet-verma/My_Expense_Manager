import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MyStatementClient } from "@/components/my-statement-client"

export default async function MyStatementPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "ADMIN" || session.user.role === "SUPERVISOR") {
    redirect("/admin")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Statement</h1>
      </div>
      <MyStatementClient userId={session.user.id} />
    </div>
  )
}
