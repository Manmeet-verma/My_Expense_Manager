import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { VerifierFundTransferForm } from "@/components/verifier-fund-transfer-form"
import { getVerifierDistributionTransactions } from "@/actions/expense"
import { VerifierDistributionTransactionsTable } from "@/components/verifier-distribution-transactions-table"

export default async function VerifierFundTransferPage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Verifier fund transfer page auth error:", error)
    redirect("/login")
  }

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "VERIFIER" && session.user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const transactions = await getVerifierDistributionTransactions()

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Fund Transfer to Inputters</h1>
        <p className="text-gray-600 mt-1">Submit fund transfer request — pending admin approval</p>
      </div>

      <div className="space-y-4">
        <div className="mx-auto w-full max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <VerifierFundTransferForm />
        </div>

        <div className="w-full rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">My Transfer Requests</h2>
          </div>

          <div className="p-4">
            <VerifierDistributionTransactionsTable transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  )
}
