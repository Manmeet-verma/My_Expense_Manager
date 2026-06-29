import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAdmins, getMembers, getSupervisors } from "@/actions/auth"
import { AdminSection } from "@/components/forms/admin-section"
import { SupervisorSection } from "@/components/forms/supervisor-section"
import { InputterListSection } from "@/components/inputter-list-section"
import { CreateAccountClient } from "./create-account-client"

type Admins = Awaited<ReturnType<typeof getAdmins>>
type Members = Awaited<ReturnType<typeof getMembers>>
type Supervisors = Awaited<ReturnType<typeof getSupervisors>>

export default async function CreateAccountPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  let admins: Admins = []
  let members: Members = []
  let supervisors: Supervisors = []

  try {
    admins = await getAdmins()
  } catch (error) {
    console.error("Failed to load admins:", error)
  }

  try {
    members = await getMembers()
  } catch (error) {
    console.error("Failed to load members:", error)
  }

  try {
    supervisors = await getSupervisors()
  } catch (error) {
    console.error("Failed to load verifiers:", error)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create & Manage Accounts</h1>
        <p className="mt-1 text-gray-600">Create, view, edit, and delete admin, verifier, and inputter accounts from one place.</p>
      </div>

      <div className="mb-8">
        <AdminSection admins={admins} currentAdminId={session.user.id} />
      </div>

      <div className="mb-8">
        <SupervisorSection supervisors={supervisors} />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Inputter List</h2>
        <InputterListSection members={members} />
      </div>

      <CreateAccountClient />
    </div>
  )
}
