import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CreateAccountClient } from "./create-account-client"
import Link from "next/link"

export default async function CreateAccountPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="mt-1 text-gray-600">Create admin, verifier, and inputter accounts from one place.</p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-lg font-semibold text-gray-900">View Lists</h2>
        <p className="mt-1 text-sm text-gray-600">Open the existing lists for admin, verifier, and inputter accounts.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-900">Admin List</h3>
            <p className="mt-1 text-sm text-gray-600">View all admin accounts.</p>
          </Link>

          <Link
            href="/admin/create-supervisor"
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-900">Verifier List</h3>
            <p className="mt-1 text-sm text-gray-600">View all verifier accounts.</p>
          </Link>

          <Link
            href="/admin/members"
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-900">Inputter List</h3>
            <p className="mt-1 text-sm text-gray-600">View all inputter accounts.</p>
          </Link>
        </div>
      </div>

      <CreateAccountClient />
    </div>
  )
}
