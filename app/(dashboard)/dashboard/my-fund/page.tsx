import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { MyFundForm } from "@/components/my-fund-form"

export default async function MyFundPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "ADMIN" || session.user.role === "SUPERVISOR" || session.user.role === "VERIFIER") {
    redirect("/admin")
  }

  const collectionSources = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const receivedFromSources = collectionSources.filter((source) => source.role !== "MEMBER")

  const getReceivedFromLabel = (role: (typeof receivedFromSources)[number]["role"], name: string | null, email: string) => {
    const roleLabel = role === "ADMIN" ? "Admin" : "Verifier"
    const identifier = name || email

    return `${roleLabel} - ${identifier}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Add Collection</h1>
      </div>

      <div className="flex justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-4 w-full max-w-xl shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 text-center border-b pb-2">Deposit Fund</h2>
          <MyFundForm
            receivedFromOptions={receivedFromSources.map((source) => ({
              label: getReceivedFromLabel(source.role, source.name, source.email),
              value: source.name || source.email || (source.role === "ADMIN" ? "Admin" : "Verifier"),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
