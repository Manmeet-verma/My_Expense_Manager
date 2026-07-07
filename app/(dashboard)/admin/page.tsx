import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAllExpenses } from "@/lib/queries"
import { getCollectionFundsForLedger, getExpenseStats } from "@/actions/expense"
import { getMembers } from "@/actions/auth"
import { AdminExpenseManagementTable } from "@/components/admin-expense-management-table"
import { SupervisorInputterFilter } from '@/components/supervisor-inputter-filter'
import MembersContent from "./members/members-content"

type MemberRow = {
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  upiId: string | null
  accountNumber: string | null
  assignedProject: string[] | null
  assignedVerifierId: string | null
  assignedVerifier: {
    id: string
    name: string | null
    email: string
  } | null
  receivedAmount: number
  totalEdits: number
  createdAt: Date
  _count: {
    expenses: number
  }
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ memberId?: string; project?: string }> }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR" && session.user.role !== "VERIFIER") {
    redirect("/dashboard")
  }

  const isAdmin = session.user.role === "ADMIN"
  const isSupervisor = session.user.role === "SUPERVISOR"
  const isVerifier = session.user.role === "VERIFIER"

  const params = await searchParams as { memberId?: string; project?: string } | null
  const memberId = params?.memberId
  const projectFilter = params?.project?.trim()?.toLowerCase()

  const expenses = await getAllExpenses(memberId && memberId !== "all" ? memberId : undefined)
  const filteredExpenses = projectFilter
    ? expenses.filter((e) =>
        e.createdBy?.assignedProject?.some((p: string) =>
          p.toLowerCase().includes(projectFilter)
        )
      )
    : expenses

  const stats = await getExpenseStats()
  const collectionFunds = await getCollectionFundsForLedger()

  let members: MemberRow[] = []
  try {
    const result = await getMembers()
    members = (result || []) as MemberRow[]
  } catch (error) {
    console.error("getMembers error:", error)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Expense Review</h1>
        <p className="mt-1 text-gray-600">Admin and verifier can approve, reject, pay, and view the same expense workflow here.</p>
      </div>

      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold text-gray-900">Inputter Accounts</h2>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="text"
            name="project"
            defaultValue={params?.project || ""}
            placeholder="Search by project name..."
            className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
          {params?.project && (
            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </a>
          )}
        </form>
      </div>

      {isSupervisor || isVerifier ? (
        <SupervisorInputterFilter members={members} actorRole={isVerifier ? "VERIFIER" : "SUPERVISOR"} />
      ) : (
        <AdminExpenseManagementTable
          actorRole="ADMIN"
          showAllExpensesByDefault
          expenses={filteredExpenses}
          totalReceivedAmount={stats?.collectionAmount ?? 0}
          collectionFunds={collectionFunds}
          afterCardsContent={
            <MembersContent
              members={members}
              canManage={isAdmin}
              canDeselect={isSupervisor || isVerifier}
              canApproveExpenses={isSupervisor || isVerifier}
            />
          }
        />
      )}
    </div>
  )
}
