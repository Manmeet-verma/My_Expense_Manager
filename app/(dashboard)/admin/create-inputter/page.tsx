import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SignupForm } from "@/components/forms/signup-form"

export default async function CreateInputterPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Create Inputter Account</h1>
        <p className="mt-1 text-gray-600">Use this page to create a new inputter account.</p>
      </div>

      <SignupForm />
    </div>
  )
}