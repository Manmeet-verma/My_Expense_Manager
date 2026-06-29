'use client'

import React, { startTransition, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminExpenseManagementTable } from './admin-expense-management-table'
import { deselectInputter } from '@/actions/auth'
import { formatCurrency } from '@/lib/utils'
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

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

interface FundData {
  amount: number
}

interface ApiResponse {
  approved: NormalizedExpense[]
  rejected: NormalizedExpense[]
  pending: NormalizedExpense[]
  paid: NormalizedExpense[]
  totalBudget: number
  receivedAmount: number
  totalCollectionFunds: number
}

type ExpenseStatusAll = ExpenseStatus

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
  const [totalBudget, setTotalBudget] = useState(0)
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [totalCollectionFunds, setTotalCollectionFunds] = useState(0)
  const [showDeselectModal, setShowDeselectModal] = useState(false)
  const [deselectReason, setDeselectReason] = useState("")
  const [deselecting, setDeselecting] = useState(false)
  const [deselectError, setDeselectError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!selectedId) return

    let cancelled = false
    startTransition(() => setLoading(true))
    fetch(`/api/expenses/member/${selectedId}`)
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        if (cancelled) return
        if ((data as unknown as { error: string }).error) {
          setExpenses([])
          return
        }
        const all = [...data.approved, ...data.pending, ...data.rejected, ...(data.paid || [])]
        const normalized: NormalizedExpense[] = all.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description ?? null,
          adminRemark: e.adminRemark ?? null,
          createdAt: e.createdAt,
          amount: e.amount,
          category: e.category,
          status: e.status,
          createdBy: e.createdBy ? {
            name: e.createdBy.name ?? null,
            email: e.createdBy.email,
            assignedProject: e.createdBy.assignedProject ?? null,
          } : { name: null, email: '', assignedProject: null },
          approvedBy: e.approvedBy ? {
            id: e.approvedBy.id,
            name: e.approvedBy.name ?? null,
            email: e.approvedBy.email,
            role: e.approvedBy.role,
          } : null,
        }))
        if (!cancelled) {
          setExpenses(normalized)
          setTotalBudget(data.totalBudget || 0)
          setReceivedAmount(data.receivedAmount || 0)
          setTotalCollectionFunds(data.totalCollectionFunds || 0)
        }
      })
      .catch(() => { if (!cancelled) setExpenses([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [selectedId])

  const pendingForVerification = expenses
    .filter((e) => e.status === "PENDING" && (!e.approvedBy || (e.approvedBy.role !== "SUPERVISOR" && e.approvedBy.role !== "VERIFIER")))
    .reduce((sum, e) => sum + e.amount, 0)

  const rejected = expenses
    .filter((e) => e.status === "REJECTED")
    .reduce((sum, e) => sum + e.amount, 0)

  const pendingForApproval = expenses
    .filter((e) => e.status === "PENDING" && e.approvedBy && (e.approvedBy.role === "SUPERVISOR" || e.approvedBy.role === "VERIFIER"))
    .reduce((sum, e) => sum + e.amount, 0)

  const approvedButPayable = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + e.amount, 0)

  const paid = expenses
    .filter((e) => e.status === "PAID")
    .reduce((sum, e) => sum + e.amount, 0)

  const totalReceivedFund = totalCollectionFunds
  const openingBalance = totalBudget
  const closingBalance = openingBalance + totalReceivedFund - paid

  async function handleDeselect() {
    if (!selectedId || !deselectReason.trim()) return
    setDeselecting(true)
    setDeselectError("")
    const result = await deselectInputter({ memberId: selectedId, reason: deselectReason.trim() })
    if (result?.error) {
      setDeselectError(result.error)
      setDeselecting(false)
      return
    }
    setDeselecting(false)
    setShowDeselectModal(false)
    setDeselectReason("")
    setSelectedId(null)
    setExpenses([])
    router.refresh()
  }

  const cards = [
    { label: "Opening Balance", value: openingBalance, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-300" },
    { label: "Pending for Verification", value: pendingForVerification, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300" },
    { label: "Rejected", value: rejected, color: "text-red-700", bg: "bg-red-50", border: "border-red-300" },
    { label: "Pending for Approval", value: pendingForApproval, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300" },
    { label: "Approved but Payable", value: approvedButPayable, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300" },
    { label: "Paid", value: paid, color: "text-green-700", bg: "bg-green-50", border: "border-green-300" },
    { label: "Total Received Fund", value: totalReceivedFund, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-300" },
    { label: "Closing Balance", value: closingBalance, color: "text-violet-900", bg: "bg-violet-50", border: "border-violet-300", subtitle: "Opening Balance + Total Received Fund - Paid" },
  ]

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

      {showDeselectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Deselect Inputter</h3>
              <button
                onClick={() => setShowDeselectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              This will remove this inputter from your assigned list. Please provide a reason.
            </p>
            <div className="mb-4">
              <Label htmlFor="deselectReason">Reason for Deselection *</Label>
              <textarea
                id="deselectReason"
                value={deselectReason}
                onChange={(e) => setDeselectReason(e.target.value)}
                placeholder="Explain why you are deselecting this inputter..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                required
              />
            </div>
            {deselectError && (
              <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-600">{deselectError}</div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeselectModal(false)}
                disabled={deselecting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => void handleDeselect()}
                disabled={deselecting || !deselectReason.trim()}
              >
                {deselecting ? "Deselecting..." : "Confirm Deselect"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedId && !loading && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Expense Overview</h2>
            <button
              onClick={() => setShowDeselectModal(true)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Deselect Inputter
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className={`rounded-lg border ${card.border} ${card.bg} p-4 text-left`}>
                <p className="text-xs text-gray-600">{card.label}</p>
                <p className={`mt-1 text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
                {card.subtitle && (
                  <p className="mt-1 text-[11px] text-gray-500">{card.subtitle}</p>
                )}
              </div>
            ))}
          </div>

          <AdminExpenseManagementTable
            actorRole={actorRole}
            expenses={expenses}
            totalReceivedAmount={0}
            collectionFunds={[]}
          />
        </>
      )}
    </div>
  )
}