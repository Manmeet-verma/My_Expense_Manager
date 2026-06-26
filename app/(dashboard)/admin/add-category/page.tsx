import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CreateCategorySection } from "@/components/forms/create-category-section"
import { getCategoryStatistics } from "@/actions/category"
import { AdminCategoryUsageSection } from "@/components/admin-category-usage-section"

export default async function AddCategoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const categories = await getCategoryStatistics()
  const canCreate = session.user.role === "ADMIN"
  const canManage = session.user.role === "ADMIN"

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Category Dashboard</h1>
        <p className="mt-1 text-gray-600">Create and manage expense categories for your organization</p>
      </div>

      <div className="space-y-6">
        <CreateCategorySection canCreate={canCreate} />

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Category Usage</h2>
            <p className="mt-1 text-sm text-gray-600">Click any category to see the related expense list.</p>
          </div>
          <div className="p-4 overflow-x-auto">
            <AdminCategoryUsageSection categories={categories} canManage={canManage} />
          </div>
        </div>
      </div>
    </div>
  )
}
