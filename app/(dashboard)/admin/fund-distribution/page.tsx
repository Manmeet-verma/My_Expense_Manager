import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FundDistributionForm } from "@/components/admin-fund-distribution-form"
import { AdminDistributionTransactionsTable } from "@/components/admin-distribution-transactions-table"
import { getDistributedFundTransactions } from "@/actions/expense"

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

  const transactions = await getDistributedFundTransactions()

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Fund Transfer to Inputters</h1>
        <p className="text-gray-600 mt-1">Transfer fund to inputters from the admin account</p>
      </div>

      <div className="space-y-4">
        <div className="mx-auto w-full max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <FundDistributionForm />
        </div>

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
