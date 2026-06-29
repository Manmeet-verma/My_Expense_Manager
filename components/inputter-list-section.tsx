"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteMember } from "@/actions/auth"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Trash2, Pencil, ChevronDown, ChevronRight } from "lucide-react"
import { EditAccountForm } from "@/components/forms/edit-account-form"

type Member = {
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  upiId: string | null
  accountNumber: string | null
  receivedAmount: number
  createdAt: Date
  _count: {
    expenses: number
  }
  totalEdits: number
}

interface InputterListSectionProps {
  members: Member[]
}

export function InputterListSection({ members }: InputterListSectionProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this inputter?")) return
    setDeletingId(id)
    const result = await deleteMember({ memberId: id })
    if (result?.error) {
      alert(result.error)
    }
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-lg font-semibold text-gray-900 hover:bg-gray-50"
      >
        <span>Inputter List ({members.length})</span>
        {isOpen ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          {editingMember && (
            <EditAccountForm
              account={{
                id: editingMember.id,
                name: editingMember.name,
                email: editingMember.email,
                fatherName: editingMember.fatherName,
                aadhaarNo: editingMember.aadhaarNo,
                upiId: editingMember.upiId,
                accountNumber: editingMember.accountNumber,
                roleLabel: "Inputter",
              }}
              onCancel={() => setEditingMember(null)}
              onSuccess={() => setEditingMember(null)}
            />
          )}

          {members.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No inputters found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Father&apos;s Name</th>
                    <th className="px-4 py-3 font-semibold">Aadhaar No.</th>
                    <th className="px-4 py-3 font-semibold">GPay / UPI</th>
                    <th className="px-4 py-3 font-semibold">Bank Account</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t border-gray-100 odd:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{member.name || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.fatherName || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.aadhaarNo || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.upiId || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.accountNumber || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.email}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(member.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMember(member)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                            disabled={deletingId === member.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === member.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
