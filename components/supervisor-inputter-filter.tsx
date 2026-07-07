'use client'

import React, { startTransition, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VerifierExpenseTable } from './verifier-expense-table'
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
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split("T")[0])
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0])
  const [activeStatus, setActiveStatus] = useState<string>("ALL")
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
          setActiveStatus("ALL")
        }
      })
      .catch(() => { if (!cancelled) setExpenses([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [selectedId])

  const dateFilteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.createdAt)
      const fromOk = !fromDate || d >= new Date(`${fromDate}T00:00:00`)
      const toOk = !toDate || d <= new Date(`${toDate}T23:59:59`)
      return fromOk && toOk
    })
  }, [expenses, fromDate, toDate])

  const statusFilteredExpenses = useMemo(() => {
    if (activeStatus === "ALL") return dateFilteredExpenses
    return dateFilteredExpenses.filter((e) => e.status === activeStatus)
  }, [dateFilteredExpenses, activeStatus])

  const totalExpenseRequested = dateFilteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const rejectedAmount = dateFilteredExpenses.filter((e) => e.status === "REJECTED").reduce((sum, e) => sum + e.amount, 0)
  const verificationPending = dateFilteredExpenses.filter((e) => e.status === "PENDING").reduce((sum, e) => sum + e.amount, 0)
  const approvedPending = dateFilteredExpenses.filter((e) => e.status === "APPROVED").reduce((sum, e) => sum + e.amount, 0)
  const netRequiredFund = totalExpenseRequested - rejectedAmount
  const paid = dateFilteredExpenses.filter((e) => e.status === "PAID").reduce((sum, e) => sum + e.amount, 0)
  const totalFundReceived = totalCollectionFunds
  const openingBalance = totalBudget
  const closingBalance = openingBalance + totalFundReceived - paid

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

  const line1Cards = [
    { label: "Total Expense Requested", value: totalExpenseRequested, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300" },
    { label: "Rejected", value: rejectedAmount, color: "text-red-700", bg: "bg-red-50", border: "border-red-300" },
    { label: "Verification Pending", value: verificationPending, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300" },
    { label: "Approved Pending", value: approvedPending, color: "text-green-700", bg: "bg-green-50", border: "border-green-300" },
    { label: "Net Required Fund", value: netRequiredFund, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300" },
  ]

  const line2Cards = [
    { label: "Opening Balance", value: openingBalance, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300" },
    { label: "Total Fund Received", value: totalFundReceived, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-300" },
    { label: "Total Fund Paid", value: paid, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-300" },
    { label: "Closing Balance", value: closingBalance, color: "text-cyan-900", bg: "bg-cyan-50", border: "border-cyan-300", subtitle: "Opening Balance + Total Fund Received - Paid" },
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
          <option value="all">All Inputters</option>
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

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 rounded-md border border-gray-300 px-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 rounded-md border border-gray-300 px-2 text-sm"
              />
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {line1Cards.map((card) => {
                const cardStatus = ({ "Rejected": "REJECTED", "Verification Pending": "PENDING", "Approved Pending": "APPROVED" })[card.label] || "ALL"
                const isActive = activeStatus === cardStatus
                return (
                  <button
                    key={card.label}
                    onClick={() => setActiveStatus(isActive ? "ALL" : cardStatus)}
                    className={`rounded-lg border text-left w-full ${card.border} ${card.bg} p-4 ${isActive ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                  >
                    <p className="text-xs text-gray-600">{card.label}</p>
                    <p className={`mt-1 text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {line2Cards.map((card) => {
                const cardStatus = ({ "Total Fund Paid": "PAID" })[card.label] || "ALL"
                const isActive = activeStatus === cardStatus
                return (
                  <button
                    key={card.label}
                    onClick={() => setActiveStatus(isActive ? "ALL" : cardStatus)}
                    className={`rounded-lg border text-left w-full ${card.border} ${card.bg} p-4 ${isActive ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                  >
                    <p className="text-xs text-gray-600">{card.label}</p>
                    <p className={`mt-1 text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
                    {card.subtitle && (
                      <p className="mt-1 text-[11px] text-gray-500">{card.subtitle}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <VerifierExpenseTable
            key={`${selectedId}-${activeStatus}`}
            expenses={statusFilteredExpenses}
            actorRole={actorRole}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
          />
        </>
      )}
    </div>
  )
}