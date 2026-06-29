'use client'

import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { formatAssignedProjects, formatCurrency, formatDate } from "@/lib/utils"
import { deleteMember } from "@/actions/auth"
import { verifyExpense } from "@/actions/expense"
import { ExportExcelButton } from "@/components/export-excel-button"
import { Input } from "@/components/ui/input"
import { EditAccountForm } from "@/components/forms/edit-account-form"
import { Pencil } from "lucide-react"

interface MemberRow {
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  upiId: string | null
  accountNumber: string | null
  assignedProject: string[] | null
  receivedAmount: number
  totalEdits: number
  createdAt: Date
  _count: {
    expenses: number
  }
}

interface MembersContentProps {
  members?: MemberRow[]
  canManage?: boolean
  canApproveExpenses?: boolean
  disableExpenseView?: boolean
}

interface MemberExpense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  status: "APPROVED" | "REJECTED" | "PENDING"
  createdAt: string
  adminRemark: string | null
  approvedByName?: string | null
  approvedByRole?: "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER" | null
  approvedBy?: {
    id: string
    name: string | null
    email: string
    role: "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER"
  } | null
}

interface MemberCollection {
  id: string
  amount: number
  receivedFrom: string
  paymentMode: "CASH" | "GPAY" | "BANK_ACCOUNT"
  fundDate: string
  createdAt: string
}

function getRoleLabel(role: "ADMIN" | "SUPERVISOR" | "VERIFIER" | "MEMBER"): string {
  if (role === "SUPERVISOR" || role === "VERIFIER") return "Verifier"
  if (role === "ADMIN") return "Admin"
  return "Inputter"
}

function getApprovedBy(expense: MemberExpense): string {
  const { status, approvedBy, approvedByName, approvedByRole } = expense
  if (status === "PENDING") return "Pending"
  if (approvedByName) {
    const roleLabel = getRoleLabel(approvedByRole || approvedBy?.role || "SUPERVISOR")
    return `${approvedByName} (${roleLabel})`
  }
  if (approvedBy) {
    const roleLabel = getRoleLabel(approvedBy.role)
    const actor = approvedBy.name || approvedBy.email
    return `${actor} (${roleLabel})`
  }
  return "Verifier (Verifier)"
}

interface MemberExpensesResponse {
  error?: string
  approved?: MemberExpense[]
  rejected?: MemberExpense[]
  pending?: MemberExpense[]
}

type MemberCollectionsResponse = MemberCollection[]

function safeParseResponse(text: string): MemberExpensesResponse | MemberCollectionsResponse | null {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

type ExpenseView = "approved" | "rejected" | "pending" | "collection"

export default function MembersContent({
  members: initialMembers,
  canManage = false,
  canApproveExpenses = false,
  disableExpenseView = false,
}: MembersContentProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null)
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null)
  const [memberChoice, setMemberChoice] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ExpenseView>("pending")
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [approving, setApproving] = useState(false)
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([])
  const [expenseHeadSearch, setExpenseHeadSearch] = useState("")
  const [memberFromDate, setMemberFromDate] = useState("")
  const [memberToDate, setMemberToDate] = useState("")
  const [detailFromDate, setDetailFromDate] = useState("")
  const [detailToDate, setDetailToDate] = useState("")
  const [expensesByStatus, setExpensesByStatus] = useState<{
    approved: MemberExpense[]
    rejected: MemberExpense[]
    pending: MemberExpense[]
  }>({ approved: [], rejected: [], pending: [] })
  const [collectionFunds, setCollectionFunds] = useState<MemberCollection[]>([])
  const members = useMemo(() => initialMembers ?? [], [initialMembers])
  const pathname = usePathname()

  async function handleDelete(memberId: string) {
    if (!canManage) {
      return
    }

    try {
      if (deletingId) return
      
      const confirmed = window.confirm("Are you sure you want to delete this inputter?")
      if (!confirmed) return
      
      setDeletingId(memberId)
      
      const result = await deleteMember({ memberId })
      
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error("Delete error:", err)
      alert("Error deleting inputter")
    } finally {
      setDeletingId(null)
    }
  }

  async function openMemberExpenses(member: MemberRow) {
    setSelectedMember(member)
    setActiveView("pending")
    setSelectedPendingIds([])
    setExpenseHeadSearch("")
    setDetailFromDate("")
    setDetailToDate("")
    setLoadingExpenses(true)

    try {
      const [expensesResponse, collectionsResponse] = await Promise.all([
        fetch(`/api/expenses/member/${member.id}`, { method: "GET" }),
        fetch(`/api/funds/statement?userId=${member.id}`, { method: "GET" }),
      ])

      const [expensesText, collectionsText] = await Promise.all([
        expensesResponse.text(),
        collectionsResponse.text(),
      ])

      const expensesData = safeParseResponse(expensesText) as MemberExpensesResponse | null
      const collectionsData = safeParseResponse(collectionsText) as MemberCollectionsResponse | null
      const parsedExpensesData = expensesData ?? {}

      if (!expensesResponse.ok) {
        throw new Error(expensesData?.error || expensesText || "Failed to load expenses")
      }

      if (!collectionsResponse.ok) {
        throw new Error(((collectionsData as { error?: string } | null)?.error) || collectionsText || "Failed to load collections")
      }

      setExpensesByStatus({
        approved: parsedExpensesData.approved || [],
        rejected: parsedExpensesData.rejected || [],
        pending: parsedExpensesData.pending || [],
      })
      setCollectionFunds(collectionsData || [])
    } catch (error) {
      console.error("Failed to load inputter expenses:", error)
      alert("Could not load inputter expenses")
      setExpensesByStatus({ approved: [], rejected: [], pending: [] })
      setCollectionFunds([])
    } finally {
      setLoadingExpenses(false)
    }
  }

  async function approveSingleExpense(id: string) {
    if (!canApproveExpenses) {
      return
    }

    setApproving(true)
    const result = await verifyExpense({ id, status: "APPROVED" })
    if (result?.error) {
      alert(result.error)
      setApproving(false)
      return
    }

    if (selectedMember) {
      await openMemberExpenses(selectedMember)
    }
    setApproving(false)
  }

  async function approveSelectedExpenses() {
    if (!canApproveExpenses) {
      return
    }

    if (selectedPendingIds.length === 0) {
      alert("Please select pending expenses first")
      return
    }

    setApproving(true)

    for (const expenseId of selectedPendingIds) {
      const result = await verifyExpense({ id: expenseId, status: "APPROVED" })
      if (result?.error) {
        alert(result.error)
        setApproving(false)
        return
      }
    }

    if (selectedMember) {
      await openMemberExpenses(selectedMember)
    }
    setApproving(false)
  }

  function toggleSelectAllPending() {
    if (selectedPendingIds.length === expensesByStatus.pending.length) {
      setSelectedPendingIds([])
      return
    }

    setSelectedPendingIds(expensesByStatus.pending.map((expense) => expense.id))
  }

  function togglePendingSelection(id: string) {
    setSelectedPendingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        const joined = new Date(member.createdAt)
        const startOk = !memberFromDate || joined >= new Date(`${memberFromDate}T00:00:00`)
        const endOk = !memberToDate || joined <= new Date(`${memberToDate}T23:59:59`)
        return startOk && endOk
      }),
    [members, memberFromDate, memberToDate]
  )

  const currentExpenses =
    activeView === "approved"
      ? expensesByStatus.approved
      : activeView === "rejected"
        ? expensesByStatus.rejected
        : activeView === "collection"
          ? collectionFunds
          : expensesByStatus.pending

  const dateFilteredCurrentExpenses =
    activeView === "collection"
      ? (currentExpenses as MemberCollection[]).filter((fund) => {
          const fundDate = new Date(fund.fundDate)
          const startOk = !detailFromDate || fundDate >= new Date(`${detailFromDate}T00:00:00`)
          const endOk = !detailToDate || fundDate <= new Date(`${detailToDate}T23:59:59`)
          return startOk && endOk
        })
      : (currentExpenses as MemberExpense[]).filter((expense) => {
          const expDate = new Date(expense.createdAt)
          const startOk = !detailFromDate || expDate >= new Date(`${detailFromDate}T00:00:00`)
          const endOk = !detailToDate || expDate <= new Date(`${detailToDate}T23:59:59`)
          return startOk && endOk
        })

  const filteredCurrentExpenses =
    activeView === "collection"
      ? dateFilteredCurrentExpenses
      : (dateFilteredCurrentExpenses as MemberExpense[]).filter((expense) =>
          expense.title.toLowerCase().includes(expenseHeadSearch.trim().toLowerCase())
        )

  const currentTotal =
    activeView === "collection"
      ? (filteredCurrentExpenses as MemberCollection[]).reduce((sum, fund) => sum + fund.amount, 0)
      : (filteredCurrentExpenses as MemberExpense[]).reduce((sum, expense) => sum + expense.amount, 0)

  const totalCollection = collectionFunds.reduce((sum, fund) => sum + fund.amount, 0)
  const totalExpenseAmount =
    expensesByStatus.approved.reduce((sum, expense) => sum + expense.amount, 0) +
    expensesByStatus.rejected.reduce((sum, expense) => sum + expense.amount, 0) +
    expensesByStatus.pending.reduce((sum, expense) => sum + expense.amount, 0)
  const remainingCollection = totalCollection - totalExpenseAmount

  const memberListExportData = useMemo(
    () =>
      filteredMembers.map((member, index) => ({
        "Sr No": index + 1,
        Name: member.name || "-",
        "Father's Name": member.fatherName || "-",
        "Aadhaar No.": member.aadhaarNo || "-",
        Email: member.email,
        "Assigned Project": formatAssignedProjects(member.assignedProject) || "-",
        Expenses: member._count.expenses,
        Collection: member.receivedAmount,
        Edits: member.totalEdits,
        Joined: formatDate(member.createdAt),
      })),
    [filteredMembers]
  )

  const selectedViewExportData = useMemo(() => {
    if (!selectedMember) return []

    if (activeView === "collection") {
      return (filteredCurrentExpenses as MemberCollection[]).map((fund, index) => ({
        "Sr No": index + 1,
        Member: selectedMember.name || selectedMember.email,
        Date: formatDate(fund.fundDate),
        "Received From": fund.receivedFrom,
        "Payment Mode": fund.paymentMode,
        Amount: fund.amount,
      }))
    }

    return (filteredCurrentExpenses as MemberExpense[]).map((expense, index) => ({
      "Sr No": index + 1,
      Inputter: selectedMember.name || selectedMember.email,
      Title: expense.title,
      Description: expense.description || "-",
      Category: expense.category,
      Amount: expense.amount,
      Date: formatDate(expense.createdAt),
      Status: expense.status,
    }))
  }, [selectedMember, activeView, filteredCurrentExpenses])

  return (
    <div className="min-h-[calc(100vh-4rem)] p-3 sm:p-6">
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Inputter List</h1>
          <p className="mt-1 text-gray-600">
            {canManage
              ? "Admin and verifier access: manage inputter accounts"
              : "Verifier access: view inputter accounts"}
          </p>
          <div className="mt-3">
            <ExportExcelButton
              data={memberListExportData}
              fileName="admin-verifier-inputters"
              sheetName="Inputters"
              label="Export Inputters Excel"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Select Inputter</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-200 bg-white py-2 px-3 text-sm shadow-sm"
              value={memberChoice ?? ""}
              onChange={async (e) => {
                const val = e.target.value || null
                setMemberChoice(val)
                if (!val) {
                  setSelectedMember(null)
                  return
                }

                if (val === "all") {
                  setSelectedMember(null)
                  return
                }

                const member = members.find((m) => m.id === val) || null
                if (member) {
                  await openMemberExpenses(member)
                }

                // update URL so dashboard can pick up selected member
                try {
                  if (pathname) {
                    router.push(`${pathname}?memberId=${val}`)
                  }
                } catch {
                  // ignore navigation errors
                }
              }}
            >
              <option value="">-- Choose an inputter --</option>
              <option value="all">All inputters</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {memberChoice === 'all' && (
        <div className="rounded-lg border border-gray-200 bg-white">
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

          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">From</span>
              <Input
                type="date"
                value={memberFromDate}
                onChange={(e) => setMemberFromDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">To</span>
              <Input
                type="date"
                value={memberToDate}
                onChange={(e) => setMemberToDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[780px] w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Father&apos;s Name</th>
                  <th className="px-4 py-3 font-semibold">Aadhaar No.</th>
                  <th className="px-4 py-3 font-semibold">GPay / UPI</th>
                  <th className="px-4 py-3 font-semibold">Bank Account</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Assigned Project</th>
                  <th className="px-4 py-3 font-semibold">Expenses</th>
                  <th className="px-4 py-3 font-semibold">Collection</th>
                  <th className="px-4 py-3 font-semibold">Edits</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                      No inputters found
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="border-t border-gray-100 odd:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {disableExpenseView ? (
                          <span>{member.name || "-"}</span>
                        ) : (
                          <button
                            onClick={() => openMemberExpenses(member)}
                            className="text-blue-700 hover:text-blue-800"
                          >
                            {member.name || "-"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{member.fatherName || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.aadhaarNo || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.upiId || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.accountNumber || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{member.email}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{formatAssignedProjects(member.assignedProject) || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{member._count.expenses}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(member.receivedAmount)}</td>
                      <td className="px-4 py-3 text-gray-700">{member.totalEdits}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(member.createdAt)}</td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setEditingMember(member)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Pencil className="inline-block h-4 w-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              disabled={deletingId === member.id}
                              className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                            >
                              {deletingId === member.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">View only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="hidden divide-y divide-gray-100">
            {members.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">No inputters found</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="p-4 space-y-3">
                  <div>
                    {disableExpenseView ? (
                      <span className="font-semibold text-gray-900">{member.name || "-"}</span>
                    ) : (
                      <button
                        onClick={() => openMemberExpenses(member)}
                        className="font-semibold text-blue-700 hover:text-blue-800"
                      >
                        {member.name || "-"}
                      </button>
                    )}
                    <p className="text-sm text-gray-600">Father: {member.fatherName || "-"}</p>
                    <p className="text-sm text-gray-600">Aadhaar: {member.aadhaarNo || "-"}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Expenses</p>
                      <p className="font-medium text-gray-900">{member._count.expenses}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Collection</p>
                      <p className="font-medium text-gray-900">{formatCurrency(member.receivedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Edits</p>
                      <p className="font-medium text-gray-900">{member.totalEdits}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Joined</p>
                      <p className="font-medium text-gray-900">{formatDate(member.createdAt)}</p>
                    </div>
                  </div>
                  {canManage ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="w-full py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        <Pencil className="inline-block h-4 w-4 mr-1" />
                        Edit Inputter
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        disabled={deletingId === member.id}
                        className="w-full py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === member.id ? "Deleting..." : "Delete Inputter"}
                      </button>
                    </div>
                  ) : (
                    <p className="w-full mt-2 py-2 text-center text-xs text-gray-500 border border-gray-200 rounded">
                      View only
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {selectedMember && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedMember.name || selectedMember.email} - Expense List
                </h2>
                <p className="text-sm text-gray-600">{selectedMember.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <ExportExcelButton
                  data={selectedViewExportData}
                  fileName={`inputter-${selectedMember.email}-${activeView}`}
                  sheetName="InputterData"
                  label="Export Current View"
                />
                {canManage && (
                  <>
                    <button
                      onClick={() => setEditingMember(selectedMember)}
                      className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-3 py-1.5"
                    >
                      <Pencil className="inline-block h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMember.id)}
                      disabled={deletingId === selectedMember.id}
                      className="text-sm text-red-600 hover:text-red-800 border border-red-200 rounded px-3 py-1.5 disabled:opacity-50"
                    >
                      {deletingId === selectedMember.id ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4 max-w-xs">
              <button
                onClick={() => setActiveView("approved")}
                className={`w-full text-left px-3 py-2 text-sm rounded ${activeView === "approved" ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-50 text-gray-700"}`}
              >
                Approved ({expensesByStatus.approved.length})
              </button>
              <button
                onClick={() => setActiveView("rejected")}
                className={`w-full text-left px-3 py-2 text-sm rounded ${activeView === "rejected" ? "bg-red-100 text-red-700 border border-red-300" : "bg-gray-50 text-gray-700"}`}
              >
                Rejected ({expensesByStatus.rejected.length})
              </button>
              <button
                onClick={() => setActiveView("pending")}
                className={`w-full text-left px-3 py-2 text-sm rounded ${activeView === "pending" ? "bg-yellow-100 text-yellow-700 border border-yellow-300" : "bg-gray-50 text-gray-700"}`}
              >
                Pending ({expensesByStatus.pending.length})
              </button>
              <button
                onClick={() => setActiveView("collection")}
                className={`w-full text-left px-3 py-2 text-sm rounded ${activeView === "collection" ? "bg-purple-100 text-purple-700 border border-purple-300" : "bg-gray-50 text-gray-700"}`}
              >
                Collection ({collectionFunds.length})
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">From</span>
                <Input
                  type="date"
                  value={detailFromDate}
                  onChange={(e) => setDetailFromDate(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">To</span>
                <Input
                  type="date"
                  value={detailToDate}
                  onChange={(e) => setDetailToDate(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
            </div>

            {activeView !== "collection" && (
              <div className="mb-4 max-w-sm">
                <input
                  type="text"
                  value={expenseHeadSearch}
                  onChange={(e) => setExpenseHeadSearch(e.target.value)}
                  placeholder="Search by Exp. Head Req."
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium text-emerald-700">Remaining Collection</p>
              <p className="mt-1 text-lg font-semibold text-emerald-900">{formatCurrency(remainingCollection)}</p>
              <p className="mt-1 text-xs text-emerald-700">
                Collection ({formatCurrency(totalCollection)}) - Total Expense ({formatCurrency(totalExpenseAmount)})
              </p>
            </div>

            {activeView === "pending" && canApproveExpenses && expensesByStatus.pending.length > 0 && (
              <div className="flex flex-col items-start gap-3 mb-4 max-w-xs">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedPendingIds.length === expensesByStatus.pending.length}
                    onChange={toggleSelectAllPending}
                  />
                  Select All
                </label>
                <button
                  onClick={approveSelectedExpenses}
                  disabled={approving || selectedPendingIds.length === 0}
                  className="w-full px-3 py-2 text-sm rounded bg-green-600 text-white disabled:opacity-50"
                >
                  {approving ? "Approving..." : `Approve Selected (${selectedPendingIds.length})`}
                </button>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-600">
                {activeView === "collection" ? "Total Collection" : "Total Amount"}
              </span>
              <span className={`font-semibold ${activeView === "collection" ? "text-purple-700" : "text-gray-900"}`}>
                {formatCurrency(currentTotal)}
              </span>
            </div>

            {loadingExpenses ? (
              <div className="py-8 text-center text-gray-500">Loading records...</div>
            ) : filteredCurrentExpenses.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No {activeView === "collection" ? "collections" : "expenses"} found in this section
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full text-xs sm:text-sm ${activeView === "collection" ? "min-w-[760px]" : "min-w-[860px]"}`}>
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      {activeView === "pending" && canApproveExpenses && <th className="px-3 py-2 font-semibold">Select</th>}
                      {activeView === "collection" ? (
                        <>
                          <th className="px-3 py-2 font-semibold">Date</th>
                          <th className="px-3 py-2 font-semibold">Received From</th>
                          <th className="px-3 py-2 font-semibold">Payment Mode</th>
                          <th className="px-3 py-2 font-semibold">Amount</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2 font-semibold">Title</th>
                          <th className="px-3 py-2 font-semibold">Description</th>
                          <th className="px-3 py-2 font-semibold">Category</th>
                          <th className="px-3 py-2 font-semibold">Amount</th>
                          <th className="px-3 py-2 font-semibold">Date</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Approved By</th>
                          <th className="px-3 py-2 font-semibold">Action</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeView === "collection"
                      ? (filteredCurrentExpenses as MemberCollection[]).map((fund) => (
                          <tr key={fund.id} className="border-t border-gray-100 odd:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700">{formatDate(fund.fundDate)}</td>
                            <td className="px-3 py-2 text-gray-900">{fund.receivedFrom}</td>
                            <td className="px-3 py-2 text-gray-700">{fund.paymentMode}</td>
                            <td className="px-3 py-2 text-gray-900">{formatCurrency(fund.amount)}</td>
                          </tr>
                        ))
                      : (filteredCurrentExpenses as MemberExpense[]).map((expense) => (
                          <tr key={expense.id} className="border-t border-gray-100 odd:bg-gray-50">
                            {activeView === "pending" && canApproveExpenses && (
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedPendingIds.includes(expense.id)}
                                  onChange={() => togglePendingSelection(expense.id)}
                                />
                              </td>
                            )}
                            <td className="px-3 py-2 text-gray-900">{expense.title}</td>
                            <td className="px-3 py-2 text-gray-700">{expense.description || "-"}</td>
                            <td className="px-3 py-2 text-gray-700">{expense.category}</td>
                            <td className="px-3 py-2 text-gray-900">{formatCurrency(expense.amount)}</td>
                            <td className="px-3 py-2 text-gray-700">{formatDate(expense.createdAt)}</td>
                            <td className="px-3 py-2 text-gray-700">{expense.status}</td>
                              <td className="px-3 py-2 text-gray-700">{getApprovedBy(expense)}</td>
                            <td className="px-3 py-2">
                              {activeView === "pending" && canApproveExpenses ? (
                                <button
                                  onClick={() => approveSingleExpense(expense.id)}
                                  disabled={approving}
                                  className="px-2 py-1 text-xs rounded bg-green-600 text-white disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              ) : activeView === "pending" ? (
                                <span className="text-xs text-gray-400">Waiting for verifier</span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
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
    </div>
  )
}
