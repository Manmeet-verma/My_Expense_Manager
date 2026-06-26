"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CreateSupervisorForm } from "@/components/forms/create-supervisor-form"
import { deleteSupervisor } from "@/actions/auth"
import { formatDate } from "@/lib/utils"
import { Trash2, Pencil } from "lucide-react"
import { EditAccountForm } from "@/components/forms/edit-account-form"

type Supervisor = {
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  createdAt: Date
}

interface SupervisorSectionProps {
  supervisors: Supervisor[]
}

export function SupervisorSection({ supervisors }: SupervisorSectionProps) {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null)
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null)

  async function handleDelete(supervisorId: string) {
    if (!confirm("Are you sure you want to delete this verifier?")) {
      return
    }

    setDeletingId(supervisorId)
    setError("")

    const result = await deleteSupervisor({ supervisorId })

    if (result?.error) {
      setError(result.error)
    }

    setDeletingId(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Verifier Accounts</h2>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} size="sm">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Verifier
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <CreateSupervisorForm />
          <div className="mt-3">
            <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {editingSupervisor && (
        <EditAccountForm
          account={{
            id: editingSupervisor.id,
            name: editingSupervisor.name,
            email: editingSupervisor.email,
            fatherName: editingSupervisor.fatherName,
            aadhaarNo: editingSupervisor.aadhaarNo,
            roleLabel: "Verifier",
          }}
          onCancel={() => setEditingSupervisor(null)}
          onSuccess={() => setEditingSupervisor(null)}
        />
      )}

      {supervisors.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Verifier</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-200 bg-white py-2 px-3 text-sm shadow-sm"
              value={selectedSupervisorId ?? ""}
              onChange={(e) => setSelectedSupervisorId(e.target.value || null)}
            >
              <option value="">-- Choose a verifier --</option>
              <option value="all">All verifiers</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name || supervisor.email}
                </option>
              ))}
            </select>
          </div>
          {selectedSupervisorId === "all" ? (
            <div>
              <div className="space-y-3 p-4 md:hidden">
                {supervisors.map((supervisor) => (
                  <div key={supervisor.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-gray-900">{supervisor.name || "N/A"}</p>
                    <p className="mt-1 text-sm text-gray-700">Father: {supervisor.fatherName || "N/A"}</p>
                    <p className="mt-1 text-sm text-gray-700">Aadhaar: {supervisor.aadhaarNo || "N/A"}</p>
                    <p className="mt-1 text-sm text-gray-700">{supervisor.email}</p>
                    <p className="mt-1 text-xs text-gray-500">Created: {formatDate(supervisor.createdAt)}</p>

                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSupervisor(supervisor)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(supervisor.id)}
                        disabled={deletingId === supervisor.id}
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingId === supervisor.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <table className="hidden min-w-full text-sm md:table">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Father&apos;s Name</th>
                    <th className="px-4 py-3 font-semibold">Aadhaar No.</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisors.map((supervisor) => (
                    <tr key={supervisor.id} className="border-t border-gray-100 odd:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{supervisor.name || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{supervisor.fatherName || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{supervisor.aadhaarNo || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{supervisor.email}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(supervisor.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSupervisor(supervisor)}
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supervisor.id)}
                            disabled={deletingId === supervisor.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === supervisor.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedSupervisorId ? (
            (() => {
              const supervisor = supervisors.find((s) => s.id === selectedSupervisorId)!
              return (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">{supervisor.name || "N/A"}</p>
                  <p className="mt-1 text-sm text-gray-700">Father: {supervisor.fatherName || "N/A"}</p>
                  <p className="mt-1 text-sm text-gray-700">Aadhaar: {supervisor.aadhaarNo || "N/A"}</p>
                  <p className="mt-1 text-sm text-gray-700">{supervisor.email}</p>
                  <p className="mt-1 text-xs text-gray-500">Created: {formatDate(supervisor.createdAt)}</p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSupervisor(supervisor)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(supervisor.id)}
                      disabled={deletingId === supervisor.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingId === supervisor.id ? "Deleting..." : "Delete"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedSupervisorId(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="text-sm text-gray-600">No verifier selected. Choose a verifier from the dropdown above to view details.</div>
          )}
        </div>
      )}
    </>
  )
}
