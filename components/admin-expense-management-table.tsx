'use client'

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams, usePathname } from "next/navigation"
import { approveOrRejectExpense, markExpensePaid, verifyExpense } from "@/actions/expense"
import { broadcastExpenseChange } from "@/lib/supabase/realtime"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ExportExcelButton } from "@/components/export-excel-button"
import { formatAssignedProjects, formatCurrency, formatDate } from "@/lib/utils"

type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID"
type ApproverRole = "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER"
type VerifyStatus = "VERIFIED" | "REJECTED" | "PENDING"
type ApprovalStatus = "APPROVED" | "PENDING" | "REJECTED"
type DashboardFilter = "all" | "pending" | "approved" | "paid" | "rejected"
type DisplayStatus = "Pending" | "Payable" | "Rejected" | "Paid"

interface ExpenseRow {
  id: string
  site: string
  inputterName: string
  assignedProject: string
  category: string
  mainHead: string
  description: string
  adminRemark: string | null
  createdAt: Date | null
  amount: number
  expenseStatus: ExpenseStatus
  approvedByName: string | null
  approvedByEmail: string | null
  approvedByRole: ApproverRole | null
  verifyStatus: VerifyStatus
  approvalStatus: ApprovalStatus
  isDraft: boolean
}

interface AdminExpenseManagementTableProps {
  members?: Array<{ id: string; name: string | null; email: string }>
  actorRole?: "ADMIN" | "SUPERVISOR" | "VERIFIER"
  showAllExpensesByDefault?: boolean
  totalReceivedAmount: number
  afterCardsContent?: ReactNode
  collectionFunds: Array<{
    id: string
    amount: number
    fundDate: Date
    createdAt: Date
    receivedFrom: string
    user: {
      name: string | null
      email: string
    } | null
  }>
  expenses: Array<{
    id: string
    title: string
    description: string | null
    adminRemark?: string | null
    createdAt: Date
    amount: number
    category: string
    status: ExpenseStatus
    createdBy?: {
      name: string | null
      email: string
      assignedProject?: string[] | null
    } | null
    approvedBy?: {
      name: string | null
      email: string
      role: ApproverRole
    } | null
  }>
}

interface LedgerRow {
  id: string
  type: "COLLECTION" | "EXPENSE"
  txDate: Date
  site: string
  category: string
  mainHead: string
  description: string
  credit: number
  debit: number
  amount: number
  expense?: ExpenseRow
}

const PAGE_SIZE = 10

function formatCategory(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getVerifyStatus(status: ExpenseStatus, approvedByRole: ApproverRole | null): VerifyStatus {
  if (status === "REJECTED") return "REJECTED"
  if (status === "APPROVED" || status === "PAID") return "VERIFIED"
  if (approvedByRole === "SUPERVISOR" || approvedByRole === "VERIFIER") return "VERIFIED"
  return "PENDING"
}

function getApprovalStatus(status: ExpenseStatus): ApprovalStatus {
  if (status === "REJECTED") return "REJECTED"
  if (status === "APPROVED" || status === "PAID") return "APPROVED"
  return "PENDING"
}

function getDisplayStatus(status: ExpenseStatus): DisplayStatus {
  if (status === "APPROVED") return "Payable"
  if (status === "PAID") return "Paid"
  if (status === "REJECTED") return "Rejected"
  return "Pending"
}

function getRoleLabel(role: ApproverRole): string {
  if (role === "SUPERVISOR") return "Verifier"
  if (role === "ADMIN") return "Admin"
  return "Inputter"
}

function getApprovedBy(
  status: ExpenseStatus,
  approvedByName: string | null,
  approvedByEmail: string | null,
  approvedByRole: ApproverRole | null
): string {
  if (status === "PENDING") return "Pending"

  if (approvedByRole) {
    const roleLabel = getRoleLabel(approvedByRole)
    const actor = approvedByName || approvedByEmail || roleLabel
    return `${actor} (${roleLabel})`
  }

  if (status === "PAID") return "Admin (Admin)"
  return "Verifier (Verifier)"
}

export function AdminExpenseManagementTable({
  actorRole = "ADMIN",
  showAllExpensesByDefault = false,
  totalReceivedAmount,
  afterCardsContent,
  collectionFunds,
  expenses,
  members,
}: AdminExpenseManagementTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const selectedMemberId = searchParams?.get("memberId") || ""
  const shouldShowReviewView = Boolean(selectedMemberId) || showAllExpensesByDefault
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | VerifyStatus>("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>("all")
  const [draftEntries, setDraftEntries] = useState<ExpenseRow[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const serverRows = useMemo<ExpenseRow[]>(
    () =>
      expenses.map((expense) => ({
        id: expense.id,
        site: expense.createdBy?.name || expense.createdBy?.email || "Unknown",
        inputterName: expense.createdBy?.name || expense.createdBy?.email || "Unknown",
        assignedProject: formatAssignedProjects(expense.createdBy?.assignedProject) || "-",
        category: formatCategory(expense.category),
        mainHead: expense.title || "-",
        description: expense.description || "-",
        adminRemark: expense.adminRemark || null,
        createdAt: expense.createdAt,
        amount: expense.amount,
        expenseStatus: expense.status,
        approvedByName: expense.approvedBy?.name || null,
        approvedByEmail: expense.approvedBy?.email || null,
        approvedByRole: expense.approvedBy?.role || null,
        verifyStatus: getVerifyStatus(expense.status, expense.approvedBy?.role || null),
        approvalStatus: getApprovalStatus(expense.status),
        isDraft: false,
      })),
    [expenses]
  )

  const amounts = useMemo(() => {
    const pending = serverRows
      .filter((row) => row.expenseStatus === "PENDING")
      .reduce((sum, row) => sum + row.amount, 0)
    const approved = serverRows
      .filter((row) => row.expenseStatus === "APPROVED")
      .reduce((sum, row) => sum + row.amount, 0)
    const paid = serverRows
      .filter((row) => row.expenseStatus === "PAID")
      .reduce((sum, row) => sum + row.amount, 0)
    const rejected = serverRows
      .filter((row) => row.expenseStatus === "REJECTED")
      .reduce((sum, row) => sum + row.amount, 0)

    return { pending, approved, paid, rejected }
  }, [serverRows])

  const totalReceivedWithAllExpenses = useMemo(
    () => totalReceivedAmount + amounts.pending + amounts.approved + amounts.paid + amounts.rejected,
    [totalReceivedAmount, amounts.pending, amounts.approved, amounts.paid, amounts.rejected]
  )

  const closingBalance = useMemo(
    () => totalReceivedWithAllExpenses - amounts.paid,
    [totalReceivedWithAllExpenses, amounts.paid]
  )

  const allRows = useMemo(() => [...draftEntries, ...serverRows], [draftEntries, serverRows])

  const dashboardFilteredRows = useMemo(() => {
    if (dashboardFilter === "all") return allRows
    return allRows.filter((row) => row.expenseStatus === dashboardFilter.toUpperCase())
  }, [allRows, dashboardFilter])

  const dateFilteredRows = useMemo(() => {
    return dashboardFilteredRows.filter((row) => {
      if (row.isDraft || !row.createdAt) return true

      const rowDate = new Date(row.createdAt)
      const startOk = !fromDate || rowDate >= new Date(`${fromDate}T00:00:00`)
      const endOk = !toDate || rowDate <= new Date(`${toDate}T23:59:59`)
      return startOk && endOk
    })
  }, [dashboardFilteredRows, fromDate, toDate])

  const filteredRows = useMemo(() => {
    const statusFilteredRows = dateFilteredRows.filter((row) =>
      statusFilter === "ALL" ? true : row.verifyStatus === statusFilter
    )

    if (!searchTerm.trim()) return statusFilteredRows

    const lowered = searchTerm.trim().toLowerCase()
    const textQuery = lowered.trim()

    return statusFilteredRows.filter((row) => {
      if (!textQuery) return true

      const approver = `${row.approvedByName || ""} ${row.approvedByEmail || ""}`.toLowerCase()

      return (
        row.mainHead.toLowerCase().includes(textQuery) ||
        row.site.toLowerCase().includes(textQuery) ||
        approver.includes(textQuery)
      )
    })
  }, [dateFilteredRows, searchTerm, statusFilter])

  const filteredCollectionRows = useMemo(() => {
    if (dashboardFilter !== "all" || statusFilter !== "ALL") {
      return []
    }

    return collectionFunds.filter((fund) => {
      const fundDate = new Date(fund.fundDate || fund.createdAt)
      const startOk = !fromDate || fundDate >= new Date(`${fromDate}T00:00:00`)
      const endOk = !toDate || fundDate <= new Date(`${toDate}T23:59:59`)

      if (!startOk || !endOk) return false

      if (!searchTerm.trim()) return true

      const lowered = searchTerm.trim().toLowerCase()
      const actor = `${fund.user?.name || ""} ${fund.user?.email || ""} ${fund.receivedFrom}`.toLowerCase()
      return actor.includes(lowered)
    })
  }, [collectionFunds, dashboardFilter, statusFilter, fromDate, toDate, searchTerm])

  const openingBalance = useMemo(() => {
    if (!fromDate) return 0

    const startDate = new Date(`${fromDate}T00:00:00`)

    const preDateExpenseRows = dashboardFilteredRows
      .filter((row) => !row.isDraft && row.createdAt)
      .filter((row) => new Date(row.createdAt as Date) < startDate)
      .filter((row) => (statusFilter === "ALL" ? true : row.verifyStatus === statusFilter))

    const preDateExpenseTotal = preDateExpenseRows.reduce((sum, row) => sum + row.amount, 0)

    const shouldIncludeCollections = dashboardFilter === "all" && statusFilter === "ALL"
    const preDateCollectionTotal = shouldIncludeCollections
      ? collectionFunds
          .filter((fund) => new Date(fund.fundDate || fund.createdAt) < startDate)
          .reduce((sum, fund) => sum + fund.amount, 0)
      : 0

    return preDateCollectionTotal - preDateExpenseTotal
  }, [fromDate, dashboardFilteredRows, statusFilter, dashboardFilter, collectionFunds])

  const ledgerRows = useMemo(() => {
    const collectionEntries: LedgerRow[] = filteredCollectionRows.map((fund) => ({
      id: `fund-${fund.id}`,
      type: "COLLECTION",
      txDate: new Date(fund.fundDate || fund.createdAt),
      site: fund.user?.name || fund.user?.email || "Collection",
      category: "Collection",
      mainHead: "Fund Collection",
      description: fund.receivedFrom || "Collection received",
      credit: fund.amount,
      debit: 0,
      amount: 0,
    }))

    const expenseEntries: LedgerRow[] = filteredRows.map((row) => ({
      id: `expense-${row.id}`,
      type: "EXPENSE",
      txDate: row.createdAt ? new Date(row.createdAt) : new Date(0),
      site: row.site,
      category: row.category,
      mainHead: row.mainHead,
      description: row.description,
      credit: 0,
      debit: row.amount,
      amount: 0,
      expense: row,
    }))

    const transactions = [...collectionEntries, ...expenseEntries].sort((a, b) => {
      const diff = b.txDate.getTime() - a.txDate.getTime()
      if (diff !== 0) return diff
      if (a.type === b.type) return 0
      return a.type === "COLLECTION" ? -1 : 1
    })

    return transactions.reduce<LedgerRow[]>((rows, entry) => {
      const previousBalance = rows.length === 0 ? openingBalance : rows[rows.length - 1].amount
      const nextBalance = previousBalance + entry.credit - entry.debit
      rows.push({ ...entry, amount: nextBalance })
      return rows
    }, [])
  }, [filteredCollectionRows, filteredRows, openingBalance])

  const totalPages = Math.max(1, Math.ceil(ledgerRows.length / PAGE_SIZE))

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return ledgerRows.slice(start, start + PAGE_SIZE)
  }, [ledgerRows, currentPage])

  const exportData = useMemo(
    () =>
      ledgerRows.map((row, index) => ({
          "Sr No": index + 1,
          "Inputter Name": row.expense?.inputterName || row.site,
          "Project Name": row.expense?.assignedProject || row.site,
          Site: row.site,
          Category: row.category,
          "Main Head": row.mainHead,
          Description: row.description,
          Credit: row.credit ? row.credit : "-",
          Debit: row.debit ? row.debit : "-",
          Amount: row.amount,
          Status: row.expense ? getDisplayStatus(row.expense.expenseStatus) : "Collection",
          "Approved By": row.expense
            ? getApprovedBy(
                row.expense.expenseStatus,
                row.expense.approvedByName,
                row.expense.approvedByEmail,
                row.expense.approvedByRole
              )
            : "-",
          Approval: row.expense ? row.expense.approvalStatus : "-",
          Action:
            row.expense?.expenseStatus === "PENDING"
              ? "Approve/Reject"
              : row.expense?.expenseStatus === "APPROVED"
                ? "Pay"
                : row.expense?.expenseStatus === "PAID"
                  ? "Paid"
                  : row.type === "COLLECTION"
                    ? "-"
                    : "Rejected",
        })),
    [ledgerRows]
  )

  function addDraftEntry() {
    const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const nextEntry: ExpenseRow = {
      id,
      site: "",
      inputterName: "",
      assignedProject: "",
      category: "",
      mainHead: "",
      description: "",
      adminRemark: null,
      createdAt: null,
      amount: 0,
      expenseStatus: "PENDING",
      approvedByName: null,
      approvedByEmail: null,
      approvedByRole: null,
      verifyStatus: "PENDING",
      approvalStatus: "PENDING",
      isDraft: true,
    }

    setDraftEntries((prev) => [nextEntry, ...prev])
    setCurrentPage(1)
  }

  function updateDraftEntry(id: string, field: keyof ExpenseRow, value: string | number) {
    setDraftEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    )
  }

  function removeDraftEntry(id: string) {
    setDraftEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return
    setCurrentPage(nextPage)
  }

  async function handleApprove(id: string) {
    if (processingId) return
    setProcessingId(id)
    const result = actorRole === "ADMIN"
      ? await approveOrRejectExpense({ id, status: "APPROVED" })
      : await verifyExpense({ id, status: "APPROVED" })
    if (result?.error) {
      alert(result.error)
      setProcessingId(null)
      return
    }
    void broadcastExpenseChange(actorRole === "ADMIN" ? "admin-approve" : "member-verified")
    setCurrentPage(1)
    router.refresh()
    setProcessingId(null)
  }

  async function handleReject(id: string) {
    if (processingId) return
    setProcessingId(id)

    let result: { error?: string; success?: boolean } | undefined
    if (actorRole === "ADMIN") {
      result = await approveOrRejectExpense({ id, status: "REJECTED" })
    } else {
      const reason = window.prompt("Please enter reason for rejection")?.trim()
      if (!reason) {
        alert("Rejection reason is required")
        setProcessingId(null)
        return
      }
      result = await verifyExpense({ id, status: "REJECTED", adminRemark: reason })
    }

    if (result?.error) {
      alert(result.error)
      setProcessingId(null)
      return
    }
    void broadcastExpenseChange(actorRole === "ADMIN" ? "admin-reject" : "member-rejected")
    setCurrentPage(1)
    router.refresh()
    setProcessingId(null)
  }

  async function handleMarkPaid(id: string) {
    if (processingId) return
    setProcessingId(id)
    const result = await markExpensePaid({ id })
    if (result?.error) {
      alert(result.error)
      setProcessingId(null)
      return
    }
    void broadcastExpenseChange("admin-paid")
    setCurrentPage(1)
    router.refresh()
    setProcessingId(null)
  }

  return (
    <div className="space-y-4">
      {afterCardsContent ? <div>{afterCardsContent}</div> : null}

      {shouldShowReviewView ? (
        <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-left">
            <p className="text-xs text-gray-600">Opening Balance</p>
            <p className="mt-1 text-xl font-bold text-gray-700">{formatCurrency(0)}</p>
          </div>

          <button
            onClick={() => {
              setDashboardFilter("all")
              setCurrentPage(1)
            }}
            className={`rounded-lg border p-4 text-left transition ${dashboardFilter === "all" ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"}`}
          >
            <p className="text-xs text-gray-600">Received Amount</p>
            <p className="mt-1 text-xl font-bold text-blue-700">{formatCurrency(totalReceivedWithAllExpenses)}</p>
            <p className="mt-1 text-[11px] text-blue-700/80">Collection + All Expenses</p>
          </button>

          <button
            onClick={() => {
              setDashboardFilter("rejected")
              setCurrentPage(1)
            }}
            className={`rounded-lg border p-4 text-left transition ${dashboardFilter === "rejected" ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}
          >
            <p className="text-xs text-gray-600">Rejected Amount</p>
            <p className="mt-1 text-xl font-bold text-red-700">{formatCurrency(amounts.rejected)}</p>
          </button>

          <button
            onClick={() => {
              setDashboardFilter("approved")
              setCurrentPage(1)
            }}
            className={`rounded-lg border p-4 text-left transition ${dashboardFilter === "approved" ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white"}`}
          >
            <p className="text-xs text-gray-600">Approved Amount but Payable</p>
            <p className="mt-1 text-xl font-bold text-yellow-700">{formatCurrency(amounts.approved)}</p>
          </button>

          <button
            onClick={() => {
              setDashboardFilter("paid")
              setCurrentPage(1)
            }}
            className={`rounded-lg border p-4 text-left transition ${dashboardFilter === "paid" ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"}`}
          >
            <p className="text-xs text-gray-600">Approved Amount but Paid</p>
            <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(amounts.paid)}</p>
          </button>

          <div className="rounded-lg border border-violet-300 bg-violet-50 p-4 text-left">
            <p className="text-xs text-violet-800">Closing Balance</p>
            <p className="mt-1 text-xl font-bold text-violet-900">{formatCurrency(closingBalance)}</p>
            <p className="mt-1 text-[11px] text-violet-800/80">Opening Balance + Received Amount - Paid</p>
          </div>

        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setDashboardFilter("pending")
              setCurrentPage(1)
            }}
            className={`rounded border px-3 py-1.5 text-sm ${dashboardFilter === "pending" ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-700"}`}
          >
            Pending Head: {formatCurrency(amounts.pending)}
          </button>
          <button
            onClick={() => {
              setDashboardFilter("rejected")
              setCurrentPage(1)
            }}
            className={`rounded border px-3 py-1.5 text-sm ${dashboardFilter === "rejected" ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-700"}`}
          >
            Rejected Head: {formatCurrency(amounts.rejected)}
          </button>
          <button
            onClick={() => {
              setDashboardFilter("paid")
              setCurrentPage(1)
            }}
            className={`rounded border px-3 py-1.5 text-sm ${dashboardFilter === "paid" ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-700"}`}
          >
            Paid Head: {formatCurrency(amounts.paid)}
          </button>
        </div>
        </>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:max-w-4xl sm:flex-row sm:flex-wrap sm:items-center">
          {/* Inputter selection is handled by the Members dropdown above; table appears when URL ?memberId is set */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "ALL" | VerifyStatus)
              setCurrentPage(1)
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
          </select>
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by site name, expense head, or approver name"
            className="w-full sm:max-w-md"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">From</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">To</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-40"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actorRole === "ADMIN" && (
            <ExportExcelButton
              data={exportData}
              fileName="admin-expense-management"
              sheetName="Expenses"
              label="Export Excel"
            />
          )}
          <Button onClick={addDraftEntry}>Add Entry</Button>
        </div>
      </div>

      {shouldShowReviewView ? (
        <>
        <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Sr No</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Inputter Name</th>
              <th className="px-4 py-3 font-semibold">Project Name (Site)</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Main Head</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Credit</th>
              <th className="px-4 py-3 font-semibold">Debit</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Verified/Rejected/Pending</th>
              <th className="px-4 py-3 font-semibold">Approved By</th>
              <th className="px-4 py-3 font-semibold">Approved/Pending</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-gray-500">
                  No entries found
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => (
                <tr key={row.id} className={`border-t align-top ${row.type === "COLLECTION" ? "border-blue-100 bg-blue-50/30" : "border-gray-100 odd:bg-gray-50"}`}>
                  <td className="px-4 py-3 text-gray-700">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{row.expense?.isDraft ? "-" : formatDate(row.txDate)}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {row.expense?.isDraft ? "-" : row.expense?.inputterName || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.expense?.isDraft ? (
                      <Input
                        value={row.site}
                        onChange={(e) => updateDraftEntry(row.expense!.id, "site", e.target.value)}
                        placeholder="Site"
                        className="h-8 min-w-[120px]"
                      />
                    ) : (
                      row.expense?.assignedProject || row.site
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.expense?.isDraft ? (
                      <Input
                        value={row.category}
                        onChange={(e) => updateDraftEntry(row.expense!.id, "category", e.target.value)}
                        placeholder="Category"
                        className="h-8 min-w-[120px]"
                      />
                    ) : (
                      row.category
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.expense?.isDraft ? (
                      <Input
                        value={row.mainHead}
                        onChange={(e) => updateDraftEntry(row.expense!.id, "mainHead", e.target.value)}
                        placeholder="Expense Head Request"
                        className="h-8 min-w-[180px]"
                      />
                    ) : (
                      row.mainHead
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.expense?.isDraft ? (
                      <Input
                        value={row.description}
                        onChange={(e) => updateDraftEntry(row.expense!.id, "description", e.target.value)}
                        placeholder="Description"
                        className="h-8 min-w-[180px]"
                      />
                    ) : (
                      <div className="space-y-1">
                        <div>{row.description}</div>
                        {row.expense?.adminRemark && row.expense.approvedByRole === "SUPERVISOR" && typeof row.expense.adminRemark === "string" ? (
                          <div className="text-xs text-red-700">Supervisor reject reason: {row.expense.adminRemark.startsWith("SUPERVISOR_REJECT:") ? row.expense.adminRemark.replace("SUPERVISOR_REJECT:", "").trim() : row.expense.adminRemark}</div>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {row.expense?.isDraft ? (
                      <Input
                        type="number"
                        value={row.debit || ""}
                        onChange={(e) => updateDraftEntry(row.expense!.id, "amount", Number(e.target.value) || 0)}
                        placeholder="0"
                        className="h-8 min-w-[120px]"
                      />
                    ) : (
                      row.debit > 0 ? formatCurrency(row.debit) : "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.expense?.isDraft ? (
                      <select
                        value={row.expense.verifyStatus}
                        onChange={(e) => updateDraftEntry(row.expense!.id, "verifyStatus", e.target.value as VerifyStatus)}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs sm:text-sm"
                      >
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    ) : row.expense ? (
                      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        getDisplayStatus(row.expense.expenseStatus) === "Paid" ? "bg-green-100 text-green-800" :
                        getDisplayStatus(row.expense.expenseStatus) === "Payable" ? "bg-yellow-100 text-yellow-800" :
                        getDisplayStatus(row.expense.expenseStatus) === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {getDisplayStatus(row.expense.expenseStatus)}
                      </span>
                    ) : (
                      "Collection"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.expense?.isDraft
                      ? "-"
                      : row.expense
                        ? getApprovedBy(
                            row.expense.expenseStatus,
                            row.expense.approvedByName,
                            row.expense.approvedByEmail,
                            row.expense.approvedByRole
                          )
                        : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.expense?.isDraft ? (
                      <select
                        value={row.expense.approvalStatus}
                        onChange={(e) => updateDraftEntry(row.expense!.id, "approvalStatus", e.target.value as ApprovalStatus)}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs sm:text-sm"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    ) : row.expense ? (
                      row.expense.verifyStatus === "VERIFIED" && row.expense.approvalStatus === "PENDING"
                        ? "VERIFIED"
                        : row.expense.approvalStatus
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.expense?.isDraft ? (
                      <Button variant="outline" size="sm" onClick={() => removeDraftEntry(row.expense!.id)}>
                        Remove
                      </Button>
                    ) : row.expense?.expenseStatus === "PENDING" || (actorRole === "ADMIN" && row.expense?.expenseStatus === "REJECTED" && (row.expense?.approvedByRole === "SUPERVISOR" || row.expense?.approvedByRole === "VERIFIER")) ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleApprove(row.expense!.id)}
                          disabled={processingId === row.expense!.id}
                        >
                          {processingId === row.expense!.id ? (actorRole === "ADMIN" ? "Approving..." : "Verifying...") : (actorRole === "ADMIN" ? "Approve" : "Verify")}
                        </Button>
                        {(actorRole === "ADMIN" || actorRole === "SUPERVISOR" || actorRole === "VERIFIER") ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleReject(row.expense!.id)}
                            disabled={processingId === row.expense!.id}
                          >
                            {processingId === row.expense!.id ? "Rejecting..." : "Reject"}
                          </Button>
                        ) : null}
                      </div>
                    ) : row.expense?.expenseStatus === "REJECTED" ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-red-700">Rejected</span>
                        {row.expense.adminRemark ? (
                          <span className="text-xs text-red-600">Reason: {row.expense.adminRemark}</span>
                        ) : null}
                      </div>
                    ) : row.expense?.expenseStatus === "APPROVED" ? (
                      (actorRole === "ADMIN" || actorRole === "VERIFIER") ? (
                        <span className="text-sm font-medium text-amber-700">Waiting for inputter response</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => void handleMarkPaid(row.expense!.id)}
                          disabled={processingId === row.expense!.id}
                        >
                          {processingId === row.expense!.id ? "Updating..." : "Pay"}
                        </Button>
                      )
                    ) : row.expense?.expenseStatus === "PAID" ? (
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">Paid</span>
                    ) : row.type === "COLLECTION" ? (
                      <span className="text-sm font-medium text-blue-700">Credit</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600 sm:text-sm">
            Showing {paginatedRows.length} of {ledgerRows.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-xs text-gray-700 sm:text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
        </>
      ) : (
        <div className="py-8 text-center text-gray-500">Select an inputter from the dropdown to view Expense Management.</div>
      )}
    </div>
  )
}
