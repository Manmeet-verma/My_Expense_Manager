import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CreateAdminForm } from "@/components/forms/create-admin-form"

export default async function CreateAdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Admin Account</h1>
        <p className="mt-1 text-gray-600">Use this page to create a new administrator account.</p>
      </div>

      <CreateAdminForm />
    </div>
  )
}