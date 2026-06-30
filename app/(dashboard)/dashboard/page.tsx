import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getExpenseStats, getMyExpenses, getMyFunds, getRejectedMemberCollections } from "@/actions/expense"
import { getMyAssignment } from "@/actions/auth"
import DashboardMemberView from "@/components/dashboard-member-view"
import { formatAssignedProjects, formatCurrency } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "ADMIN" || session.user.role === "SUPERVISOR") {
    redirect("/admin")
  }

  const stats = await getExpenseStats()
  const expenses = await getMyExpenses()
  const funds = await getMyFunds()
  const assignment = await getMyAssignment()
  const rejectedCollections = await getRejectedMemberCollections()
  const siteName = formatAssignedProjects(assignment?.assignedProject) || session.user.name || session.user.email

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      {rejectedCollections.length > 0 && (
        <div className="mb-5 space-y-2">
          {rejectedCollections.map((rc) => (
            <div key={rc.id} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Collection Rejected</p>
              <p className="mt-1 text-sm text-gray-900">
                Your collection of <span className="font-semibold">{formatCurrency(rc.amount)}</span> from <span className="font-semibold">{rc.receivedFrom}</span> was rejected.
              </p>
              {rc.adminRemark && (
                <p className="mt-1 text-sm text-red-600">
                  Reason: {rc.adminRemark}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Expenses</h1>
      </div>

      <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">My Assignment</p>
        <p className="mt-1 text-sm text-gray-900">
          Project: <span className="font-semibold">{formatAssignedProjects(assignment?.assignedProject) || "Not assigned"}</span>
        </p>
        <p className="mt-1 text-sm text-gray-900">
          Verifier: <span className="font-semibold">{assignment?.assignedVerifier?.name || assignment?.assignedVerifier?.email || "Not assigned"}</span>
        </p>
      </div>

      <DashboardMemberView stats={stats} expenses={expenses} funds={funds} site={siteName} />
    </div>
  )
}
