"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteAdmin } from "@/actions/auth"
import { formatDate } from "@/lib/utils"
import { Trash2, Pencil } from "lucide-react"
import { EditAccountForm } from "@/components/forms/edit-account-form"

type Admin = {
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  createdAt: Date
}

interface AdminSectionProps {
  admins: Admin[]
  currentAdminId: string
}

export function AdminSection({ admins, currentAdminId }: AdminSectionProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)

  async function handleDelete(adminId: string) {
    if (!confirm("Are you sure you want to delete this admin?")) {
      return
    }

    setDeletingId(adminId)
    setError("")

    const result = await deleteAdmin({ adminId })

    if (result?.error) {
      setError(result.error)
    }

    setDeletingId(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Admin Accounts</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {editingAdmin && (
        <EditAccountForm
          account={{
            id: editingAdmin.id,
            name: editingAdmin.name,
            email: editingAdmin.email,
            fatherName: editingAdmin.fatherName,
            aadhaarNo: editingAdmin.aadhaarNo,
            roleLabel: "Admin",
          }}
          onCancel={() => setEditingAdmin(null)}
          onSuccess={() => setEditingAdmin(null)}
        />
      )}

      {admins.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Admin</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-200 bg-white py-2 px-3 text-sm shadow-sm"
              value={selectedAdminId ?? ""}
              onChange={(e) => setSelectedAdminId(e.target.value || null)}
            >
              <option value="">-- Choose an admin --</option>
              <option value="all">All admins</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name || admin.email} {admin.id === currentAdminId ? "(You)" : ""}
                </option>
              ))}
            </select>
          </div>
          {selectedAdminId === "all" ? (
            <div>
              <div className="space-y-3 p-4 md:hidden">
                {admins.map((admin) => (
                  <div key={admin.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {admin.name || "N/A"}
                      {admin.id === currentAdminId && (
                        <span className="ml-2 text-xs text-blue-600">(You)</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">Father: {admin.fatherName || "N/A"}</p>
                    <p className="mt-1 text-sm text-gray-700">Aadhaar: {admin.aadhaarNo || "N/A"}</p>
                    <p className="mt-1 text-sm text-gray-700">{admin.email}</p>
                    <p className="mt-1 text-xs text-gray-500">Created: {formatDate(admin.createdAt)}</p>

                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAdmin(admin)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {admin.id !== currentAdminId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
                          disabled={deletingId === admin.id}
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deletingId === admin.id ? "Deleting..." : "Delete"}
                        </Button>
                      )}
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
                    <th className="px-4 py-3 font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-gray-100 odd:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {admin.name || "N/A"}
                        {admin.id === currentAdminId && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{admin.fatherName || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{admin.aadhaarNo || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{admin.email}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(admin.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAdmin(admin)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {admin.id !== currentAdminId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(admin.id)}
                              disabled={deletingId === admin.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {deletingId === admin.id ? "Deleting..." : "Delete"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedAdminId ? (
            (() => {
              const admin = admins.find((a) => a.id === selectedAdminId)!
              return (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {admin.name || "N/A"}
                    {admin.id === currentAdminId && (
                      <span className="ml-2 text-xs text-blue-600">(You)</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">Father: {admin.fatherName || "N/A"}</p>
                  <p className="mt-1 text-sm text-gray-700">Aadhaar: {admin.aadhaarNo || "N/A"}</p>
                  <p className="mt-1 text-sm text-gray-700">{admin.email}</p>
                  <p className="mt-1 text-xs text-gray-500">Created: {formatDate(admin.createdAt)}</p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAdmin(admin)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {admin.id !== currentAdminId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(admin.id)}
                        disabled={deletingId === admin.id}
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingId === admin.id ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedAdminId(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="text-sm text-gray-600">No admin selected. Choose an admin from the dropdown above to view details.</div>
          )}
        </div>
      )}
    </>
  )
}
