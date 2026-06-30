import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FundDistributionForm } from "@/components/admin-fund-distribution-form"
import { AdminDistributionTransactionsTable } from "@/components/admin-distribution-transactions-table"
import { AdminPendingTransfersTable } from "@/components/admin-pending-transfers-table"
import { getDistributedFundTransactions, getPendingFundTransfers, getPendingMemberCollections } from "@/actions/expense"
import { AdminPendingCollectionsTable } from "@/components/admin-pending-collections-table"

export default async function FundDistributionPage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Fund distribution page auth error:", error)
    redirect("/login")
  }

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [transactions, pendingTransfers, pendingCollections] = await Promise.all([
    getDistributedFundTransactions(),
    getPendingFundTransfers(),
    getPendingMemberCollections(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Fund Transfer to Inputters</h1>
        <p className="text-gray-600 mt-1">Transfer fund to inputters from the admin account</p>
      </div>

      <div className="space-y-6">
        <div className="mx-auto w-full max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <FundDistributionForm />
        </div>

        {pendingCollections.length > 0 && (
          <div className="w-full rounded-lg border border-blue-200 bg-blue-50">
            <div className="border-b border-blue-100 px-4 py-3">
              <h2 className="text-lg font-semibold text-blue-900">Pending Inputter Collections</h2>
              <p className="text-sm text-blue-700 mt-0.5">Approve or reject collection requests from inputters</p>
            </div>
            <div className="p-4">
              <AdminPendingCollectionsTable collections={pendingCollections} />
            </div>
          </div>
        )}

        {pendingTransfers.length > 0 && (
          <div className="w-full rounded-lg border border-amber-200 bg-amber-50">
            <div className="border-b border-amber-100 px-4 py-3">
              <h2 className="text-lg font-semibold text-amber-900">Pending Verifier Transfers</h2>
              <p className="text-sm text-amber-700 mt-0.5">Approve or reject fund transfer requests from verifiers</p>
            </div>
            <div className="p-4">
              <AdminPendingTransfersTable transactions={pendingTransfers} />
            </div>
          </div>
        )}

        <div className="w-full rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Distribution Transactions</h2>
          </div>

          <div className="p-4">
            <AdminDistributionTransactionsTable transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  )
}
