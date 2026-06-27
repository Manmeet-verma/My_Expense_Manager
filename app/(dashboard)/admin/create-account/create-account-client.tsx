"use client"

import { useState } from "react"
import { CreateAdminForm } from "@/components/forms/create-admin-form"
import { CreateSupervisorForm } from "@/components/forms/create-supervisor-form"
import { SignupForm } from "@/components/forms/signup-form"
import { UserCog, UserCheck, UserPlus } from "lucide-react"

type ActiveForm = "admin" | "supervisor" | "inputter" | null

const formConfig = [
  {
    id: "admin" as const,
    label: "Create Admin Account",
    icon: UserCog,
    description: "Create a new admin account with full access.",
  },
  {
    id: "supervisor" as const,
    label: "Create Verifier Account",
    icon: UserCheck,
    description: "Create a new verifier account to review expenses.",
  },
  {
    id: "inputter" as const,
    label: "Create Inputter Account",
    icon: UserPlus,
    description: "Create a new inputter account to submit expenses.",
  },
]

export function CreateAccountClient() {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)

  function handleClose() {
    setActiveForm(null)
  }

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {formConfig.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveForm(activeForm === id ? null : id)}
            className={`rounded-xl border bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm ${
              activeForm === id ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">{label}</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </button>
        ))}
      </div>

      {activeForm === "admin" && (
        <div className="mb-6">
          <CreateAdminForm onCancel={handleClose} onSuccess={handleClose} />
        </div>
      )}

      {activeForm === "supervisor" && (
        <div className="mb-6">
          <CreateSupervisorForm />
        </div>
      )}

      {activeForm === "inputter" && (
        <div className="mb-6">
          <SignupForm />
        </div>
      )}
    </>
  )
}
