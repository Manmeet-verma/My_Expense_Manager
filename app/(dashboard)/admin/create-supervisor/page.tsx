import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSupervisors } from "@/actions/auth"
import { SupervisorSection } from "@/components/forms/supervisor-section"

export default async function CreateSupervisorPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const supervisors = await getSupervisors()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verifier Dashboard</h1>
        <p className="mt-1 text-gray-600">Create and manage verifier accounts</p>
      </div>

      <SupervisorSection supervisors={supervisors} />
    </div>
  )
}
