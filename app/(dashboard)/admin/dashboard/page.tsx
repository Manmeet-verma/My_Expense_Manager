import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAdmins, getMembers, getSupervisors } from "@/actions/auth"
import { getAllExpenses } from "@/lib/queries"
import { getCollectionFundsForLedger, getExpenseStats } from "@/actions/expense"
import { AdminSection } from "@/components/forms/admin-section"
import { SupervisorSection } from "@/components/forms/supervisor-section"
import { AdminExpenseManagementTable } from "@/components/admin-expense-management-table"
import MembersContent from "../members/members-content"

type Admins = Awaited<ReturnType<typeof getAdmins>>
type Members = Awaited<ReturnType<typeof getMembers>>
type Supervisors = Awaited<ReturnType<typeof getSupervisors>>
type Expenses = Awaited<ReturnType<typeof getAllExpenses>>
type CollectionFunds = Awaited<ReturnType<typeof getCollectionFundsForLedger>>
type ExpenseStats = Awaited<ReturnType<typeof getExpenseStats>>

export default async function AdminDashboardPage({ searchParams }: { searchParams?: Promise<{ memberId?: string }> }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  let admins: Admins = []
  let members: Members = []
  let supervisors: Supervisors = []
  let expenses: Expenses = []
  let collectionFunds: CollectionFunds = []
  let stats: ExpenseStats | null = null

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

  try {
    const memberId = (await searchParams as { memberId?: string } | null)?.memberId
    expenses = await getAllExpenses(memberId === "all" ? undefined : memberId)
  } catch (error) {
    console.error("Failed to load dashboard expenses:", error)
  }

  try {
    collectionFunds = await getCollectionFundsForLedger()
  } catch (error) {
    console.error("Failed to load collection funds:", error)
  }

  try {
    stats = await getExpenseStats()
  } catch (error) {
    console.error("Failed to load expense stats:", error)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">Manage expense heads</p>
      </div>

      <AdminSection admins={admins} currentAdminId={session.user.id} />

      <div className="mt-10">
        <SupervisorSection supervisors={supervisors} />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Inputter List</h2>
            <p className="mt-1 text-sm text-gray-600">
              Open the same inputter page used in the sidebar for full inputter expense details.
            </p>
          </div>
        </div>
        <MembersContent members={members} canManage={true} canApproveExpenses={false} />
      </div>

      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Expense Management</h2>
          <p className="mt-1 text-sm text-gray-600">Review entries in table format with search and pagination</p>
        </div>
        {expenses.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Expense management data could not be loaded right now, but the inputter list is still available above.
          </div>
        ) : (
          <AdminExpenseManagementTable
            expenses={expenses}
            totalReceivedAmount={stats?.collectionAmount ?? 0}
            collectionFunds={collectionFunds}
          />
        )}
      </div>
    </div>
  )
}
