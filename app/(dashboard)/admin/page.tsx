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
  assignedProject: string[] | null
  receivedAmount: number
  totalEdits: number
  createdAt: Date
  _count: {
    expenses: number
  }
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ memberId?: string }> }) {
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

  const memberId = (await searchParams as { memberId?: string } | null)?.memberId

  const expenses = await getAllExpenses(memberId && memberId !== "all" ? memberId : undefined)
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

      <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold text-gray-900">Inputter Accounts</h2>
      </div>

      {isSupervisor || isVerifier ? (
        <SupervisorInputterFilter members={members} actorRole={isVerifier ? "VERIFIER" : "SUPERVISOR"} />
      ) : (
        <AdminExpenseManagementTable
          actorRole="ADMIN"
          showAllExpensesByDefault
          expenses={expenses}
          totalReceivedAmount={stats?.collectionAmount ?? 0}
          collectionFunds={collectionFunds}
          afterCardsContent={
            <MembersContent
              members={members}
              canManage={isAdmin || isSupervisor}
              canApproveExpenses={isSupervisor || isVerifier}
            />
          }
        />
      )}
    </div>
  )
}
