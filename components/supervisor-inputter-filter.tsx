'use client'

import React, { useEffect, useState } from 'react'
import { AdminExpenseManagementTable } from './admin-expense-management-table'

interface Member {
  id: string
  name: string | null
  email: string
}

export function SupervisorInputterFilter({
  members,
  actorRole = "SUPERVISOR",
}: {
  members: Member[]
  actorRole?: "SUPERVISOR" | "VERIFIER"
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) {
      setExpenses([])
      return
    }

    let mounted = true
    setLoading(true)
    fetch(`/api/expenses/member/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        if (data.error) {
          setExpenses([])
          return
        }
        const all = [...(data.approved || []), ...(data.pending || []), ...(data.rejected || [])]
        // Normalize shape expected by AdminExpenseManagementTable
        const normalized = all.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          adminRemark: e.adminRemark ?? null,
          createdAt: e.createdAt,
          amount: e.amount,
          category: e.category,
          status: e.status,
          createdBy: e.createdBy ? {
            name: e.createdBy.name,
            email: e.createdBy.email,
            assignedProject: e.createdBy.assignedProject,
          } : { name: null, email: '', assignedProject: null },
          approvedBy: e.approvedBy || null,
        }))
        setExpenses(normalized)
      })
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false))

    return () => {
      mounted = false
    }
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
