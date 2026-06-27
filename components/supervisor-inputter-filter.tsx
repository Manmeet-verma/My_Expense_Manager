'use client'

import React, { startTransition, useEffect, useState } from 'react'
import { AdminExpenseManagementTable } from './admin-expense-management-table'

interface Member {
  id: string
  name: string | null
  email: string
}

type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID"

interface NormalizedExpense {
  id: string
  title: string
  description: string | null
  adminRemark: string | null
  createdAt: string
  amount: number
  category: string
  status: ExpenseStatus
  createdBy: {
    name: string | null
    email: string
    assignedProject: string[] | null
  }
  approvedBy: {
    id: string
    name: string | null
    email: string
    role: "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER"
  } | null
}

export function SupervisorInputterFilter({
  members,
  actorRole = "SUPERVISOR",
}: {
  members: Member[]
  actorRole?: "SUPERVISOR" | "VERIFIER"
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<NormalizedExpense[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) return

    let cancelled = false
    startTransition(() => setLoading(true))
    fetch(`/api/expenses/member/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.error) {
          setExpenses([])
          return
        }
        const all = [...(data.approved || []), ...(data.pending || []), ...(data.rejected || [])]
        const normalized: NormalizedExpense[] = all.map((e: Record<string, unknown>) => ({
          id: e.id as string,
          title: e.title as string,
          description: (e.description as string | null) ?? null,
          adminRemark: (e.adminRemark as string | null) ?? null,
          createdAt: e.createdAt as string,
          amount: e.amount as number,
          category: e.category as string,
          status: e.status as ExpenseStatus,
          createdBy: e.createdBy ? {
            name: (e.createdBy as Record<string, unknown>).name as string | null,
            email: (e.createdBy as Record<string, unknown>).email as string,
            assignedProject: (e.createdBy as Record<string, unknown>).assignedProject as string[] | null,
          } : { name: null, email: '', assignedProject: null },
          approvedBy: (e.approvedBy as Record<string, unknown>) ? {
            id: (e.approvedBy as Record<string, unknown>).id as string,
            name: (e.approvedBy as Record<string, unknown>).name as string | null,
            email: (e.approvedBy as Record<string, unknown>).email as string,
            role: (e.approvedBy as Record<string, unknown>).role as "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER",
          } : null,
        }))
        if (!cancelled) setExpenses(normalized)
      })
      .catch(() => { if (!cancelled) setExpenses([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [selectedId])

  return (
    <div className="mt-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Inputter</label>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">-- Select inputter --</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.email}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading expenses...</p>}

      {!selectedId && <p className="text-sm text-gray-500">No inputter selected. Expenses will appear after selection.</p>}

      {selectedId && !loading && (
        <AdminExpenseManagementTable
          actorRole={actorRole}
          expenses={expenses}
          totalReceivedAmount={0}
          collectionFunds={[]}
        />
      )}
    </div>
  )
}
