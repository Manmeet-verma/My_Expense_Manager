'use server'

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const optionalStringSchema = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().optional()
)

const expenseSchema = z.object({
  title: optionalStringSchema,
  description: optionalStringSchema,
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
})

const approvalSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  adminRemark: z.string().optional(),
})

const paymentSchema = z.object({
  id: z.string(),
})

const adminDeleteExpenseSchema = z.object({
  id: z.string(),
})

export async function createExpense(data: z.infer<typeof expenseSchema>) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  if (session.user.role !== "MEMBER") {
    return { error: "Only inputters can create expenses" }
  }

  const result = expenseSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { title, description, amount, category } = result.data

  await prisma.expense.create({
    data: {
      title: title || category,
      description,
      amount,
      category,
      createdById: session.user.id,
    },
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getMyExpenses() {
  const session = await auth()
  
  if (!session?.user) {
    return []
  }

  if (session.user.role !== "MEMBER") {
    return []
  }

  return await prisma.expense.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAllExpenses(memberId?: string) {
  const session = await auth()

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return []
  }

  const whereClause = memberId
    ? { createdById: memberId }
    : { createdBy: { role: "MEMBER" as const } }

  return await prisma.expense.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          totalBudget: true,
          assignedProject: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function updateExpense(id: string, data: z.infer<typeof expenseSchema>) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  if (session.user.role !== "MEMBER") {
    return { error: "Only inputters can edit expenses" }
  }

  const expense = await prisma.expense.findUnique({
    where: { id },
  })

  if (!expense) {
    return { error: "Expense not found" }
  }

  if (expense.createdById !== session.user.id) {
    return { error: "You can only edit your own expenses" }
  }

  if (expense.status !== "PENDING") {
    return { error: "Cannot edit approved or rejected expenses" }
  }

  const result = expenseSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { title, description, amount, category } = result.data

  await prisma.expense.update({
    where: { id },
    data: {
      title,
      description,
      amount,
      category,
      editCount: {
        increment: 1,
      },
    },
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteExpense(id: string) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  if (session.user.role !== "MEMBER") {
    return { error: "Only inputters can delete expenses" }
  }

  const expense = await prisma.expense.findUnique({
    where: { id },
  })

  if (!expense) {
    return { error: "Expense not found" }
  }

  if (expense.createdById !== session.user.id) {
    return { error: "You can only delete your own expenses" }
  }

  if (expense.status !== "PENDING") {
    return { error: "Cannot delete approved or rejected expenses" }
  }

  await prisma.expense.delete({
    where: { id },
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function approveOrRejectExpense(data: z.infer<typeof approvalSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized - Admin access required" }
  }

  const result = approvalSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { id, status, adminRemark } = result.data

  const expense = await prisma.expense.findUnique({
    where: { id },
  })

  if (!expense) {
    return { error: "Expense not found" }
  }

  // Allow approving/rejecting PENDING expenses or REJECTED expenses that were rejected by supervisor/verifier
  const isSupervisorRejected = expense.status === "REJECTED" && (expense.approvedByRole === "SUPERVISOR" || expense.approvedByRole === "VERIFIER")
  if (expense.status !== "PENDING" && !isSupervisorRejected) {
    return { error: "Only pending or supervisor-rejected expenses can be processed" }
  }

  await prisma.expense.update({
    where: { id },
    data: {
      status,
      adminRemark,
      approvedById: session.user.id,
      approvedByName: session.user.name || session.user.email,
      approvedByRole: session.user.role,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/members")
  return { success: true }
}

export async function verifyExpense(data: z.infer<typeof approvalSchema>) {
  const session = await auth()

  if (!session?.user || (session.user.role !== "SUPERVISOR" && session.user.role !== "VERIFIER")) {
    return { error: "Unauthorized - Supervisor/Verifier access required" }
  }

  const result = approvalSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { id, status, adminRemark } = result.data

  const expense = await prisma.expense.findUnique({ where: { id } })

  if (!expense) {
    return { error: "Expense not found" }
  }

  if (expense.status !== "PENDING") {
    return { error: "Only pending expenses can be processed" }
  }

  if (status === "REJECTED" && (!adminRemark || !adminRemark.trim())) {
    return { error: "Rejection reason is required" }
  }

  // When a supervisor/verifier rejects an expense, set status to REJECTED
  // but record who rejected it so admin can see the override option
  await prisma.expense.update({
    where: { id },
    data: {
      status: status === "REJECTED" ? "REJECTED" : "PENDING",
      adminRemark,
      // record who verified/rejected it (supervisor/verifier)
      approvedById: session.user.id,
      approvedByName: session.user.name || session.user.email,
      approvedByRole: session.user.role,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/members")
  return { success: true }
}

export async function markExpensePaid(data: z.infer<typeof paymentSchema>) {
  const session = await auth()

  if (!session?.user) {
    return { error: "Unauthorized - Admin access required" }
  }

  const result = paymentSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { id } = result.data

  const expense = await prisma.expense.findUnique({
    where: { id },
  })

  if (!expense) {
    return { error: "Expense not found" }
  }

  if (expense.status !== "APPROVED") {
    return { error: "Only approved expenses can be marked as paid" }
  }

  // Allow admin to mark any approved expense as PAID. Allow member to mark their own approved expense as PAID.
  if (session.user.role === "ADMIN") {
    await prisma.expense.update({
      where: { id },
      data: {
        status: "PAID",
        approvedById: session.user.id,
        approvedByName: session.user.name || session.user.email,
        approvedByRole: session.user.role,
      },
    })
  } else if (session.user.role === "MEMBER") {
    if (expense.createdById !== session.user.id) {
      return { error: "Members can only mark their own approved expenses as paid" }
    }

    await prisma.expense.update({
      where: { id },
      data: {
        status: "PAID",
        // do not overwrite approvedBy fields when member marks paid
      },
    })
  } else {
    return { error: "Unauthorized - Admin or Owner access required" }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/members")
  return { success: true }
}

export async function deleteExpenseFromReview(data: z.infer<typeof adminDeleteExpenseSchema>) {
  const session = await auth()

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return { error: "Unauthorized" }
  }

  const result = adminDeleteExpenseSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { id } = result.data

  const expense = await prisma.expense.findUnique({
    where: { id },
  })

  if (!expense) {
    return { error: "Expense not found" }
  }

  await prisma.expense.delete({
    where: { id },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/members")
  return { success: true }
}

export async function getExpenseStats() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  const canViewGlobalStats = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR"

  const where = canViewGlobalStats
    ? {}
    : { createdById: session.user.id }

  // Avoid running these inside a single interactive transaction to prevent
  // "expired transaction" timeouts on slow DB connections. Run queries in
  // parallel with Promise.all instead.
  const [
    total,
    pending,
    approved,
    rejected,
    paid,
    totalApprovedAmount,
    totalPaidAmount,
    pendingAmount,
    rejectedAmount,
    totalCollectionAmount,
    submittedAmount,
  ] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.count({ where: { ...where, status: "PENDING" } }),
    prisma.expense.count({ where: { ...where, status: "APPROVED" } }),
    prisma.expense.count({ where: { ...where, status: "REJECTED" } }),
    prisma.expense.count({ where: { ...where, status: "PAID" } }),
    prisma.expense.aggregate({ where: { ...where, status: "APPROVED" }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { ...where, status: "PAID" }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { ...where, status: "PENDING" }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { ...where, status: "REJECTED" }, _sum: { amount: true } }),
    prisma.fund.aggregate({ where: canViewGlobalStats ? {} : { userId: session.user.id }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ])

  // Get user's total budget
  let totalBudget = 0
  if (session.user.role === "MEMBER") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totalBudget: true },
    })
    totalBudget = user?.totalBudget || 0
  }

  const submittedTotal = submittedAmount._sum.amount || 0
  const remainingBudget = totalBudget - submittedTotal

  return {
    total,
    pending,
    approved,
    rejected,
    paid,
    pendingAmount: pendingAmount._sum.amount || 0,
    rejectedAmount: rejectedAmount._sum.amount || 0,
    totalApprovedAmount: totalApprovedAmount._sum.amount || 0,
    totalPaidAmount: totalPaidAmount._sum.amount || 0,
    collectionAmount: totalCollectionAmount._sum.amount || 0,
    totalBudget,
    submittedAmount: submittedTotal,
    remainingBudget,
  }
}

export async function getApprovedExpenses() {
  const session = await auth()
  
  if (!session?.user) {
    return []
  }

  if (session.user.role !== "MEMBER" && session.user.role !== "ADMIN") {
    return []
  }

  const where =
    session.user.role === "ADMIN"
      ? { status: "APPROVED" as const }
      : { createdById: session.user.id, status: "APPROVED" as const }

  return await prisma.expense.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
}

export async function getRejectedExpenses() {
  const session = await auth()
  
  if (!session?.user) {
    return []
  }

  if (session.user.role !== "MEMBER" && session.user.role !== "ADMIN") {
    return []
  }

  const where =
    session.user.role === "ADMIN"
      ? { status: "REJECTED" as const }
      : { createdById: session.user.id, status: "REJECTED" as const }

  return await prisma.expense.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
}

export async function updateUserBudget(newBudget: number) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  if (session.user.role === "ADMIN") {
    return { error: "Admins cannot update budget" }
  }

  if (newBudget < 0) {
    return { error: "Budget must be 0 or greater" }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { totalBudget: newBudget },
    select: { totalBudget: true },
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin")
  revalidatePath("/admin/members")

  return { success: true, totalBudget: updated.totalBudget }
}

const fundSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  receivedFrom: z.string().min(1, "Received from is required"),
  paymentMode: z.enum(["CASH", "GPAY", "BANK_ACCOUNT"]),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
  fundDate: z.string().optional(),
})

export async function createFund(data: z.infer<typeof fundSchema>) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  if (session.user.role !== "MEMBER") {
    return { error: "Only inputters can deposit funds" }
  }

  const result = fundSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { amount, receivedFrom, paymentMode, upiId, accountNumber, fundDate } = result.data

  await prisma.fund.create({
    data: {
      amount,
      receivedFrom,
      paymentMode,
      upiId: paymentMode === "GPAY" ? upiId || null : null,
      accountNumber: paymentMode === "BANK_ACCOUNT" ? accountNumber || null : null,
      fundDate: fundDate ? new Date(fundDate) : new Date(),
      userId: session.user.id,
    },
  })

  revalidatePath("/dashboard/my-statement")
  return { success: true }
}

export async function getMyFunds() {
  const session = await auth()
  
  if (!session?.user) {
    return []
  }

  if (session.user.role !== "MEMBER") {
    return []
  }

  return await prisma.fund.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
}

export async function getCollectionFundsForLedger() {
  const session = await auth()

  if (!session?.user) {
    return []
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    return []
  }

  return await prisma.fund.findMany({
    where: {
      NOT: {
        receivedFrom: {
          startsWith: "Admin Distribution",
        },
      },
    },
    select: {
      id: true,
      amount: true,
      fundDate: true,
      createdAt: true,
      receivedFrom: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { fundDate: "asc" },
  })
}

const distributeFundSchema = z.object({
  memberId: z.string().min(1, "Inputter ID is required"),
  amount: z.number().positive("Amount must be positive"),
  description: optionalStringSchema,
  paymentMode: z.enum(["CASH", "GPAY", "BANK_ACCOUNT"]),
})

const updateDistributedFundTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  amount: z.number().positive("Amount must be positive"),
  fundDate: z.string().min(1, "Fund date is required"),
  description: optionalStringSchema,
  paymentMode: z.enum(["CASH", "GPAY", "BANK_ACCOUNT"]),
})

const deleteDistributedFundTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
})

const ADMIN_DISTRIBUTION_PREFIX = "Admin Distribution"

function buildDistributionReceivedFrom(source: string, description?: string) {
  const normalizedDescription = description?.trim()
  return normalizedDescription ? `${source} | ${normalizedDescription}` : source
}

function getDistributionSource(receivedFrom: string) {
  return receivedFrom.split("|")[0]?.trim() || receivedFrom
}

function parseDistributionDescription(receivedFrom: string) {
  const description = receivedFrom.split("|").slice(1).join("|").trim()
  return description || null
}

function revalidateDistributionPaths() {
  revalidatePath("/admin")
  revalidatePath("/admin/fund-distribution")
  revalidatePath("/admin/dashboard")
  revalidatePath("/dashboard/my-statement")
  revalidatePath("/dashboard/statement")
}

export async function distributeFund(data: z.infer<typeof distributeFundSchema>) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  if (session.user.role !== "ADMIN") {
    return { error: "Only admins can distribute funds" }
  }

  const result = distributeFundSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { memberId, amount, description, paymentMode } = result.data

  const member = await prisma.user.findFirst({
    where: {
      id: memberId,
      role: "MEMBER",
    },
    select: {
      id: true,
    },
  })

  if (!member) {
    return { error: "Inputter not found" }
  }

  const distributedBy = session.user.name || session.user.email
  const source = `${ADMIN_DISTRIBUTION_PREFIX}: ${distributedBy}`
  const receivedFrom = buildDistributionReceivedFrom(source, description)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: memberId },
      data: {
        receivedAmount: {
          increment: amount,
        },
      },
    }),
    prisma.fund.create({
      data: {
        amount,
        receivedFrom,
        paymentMode,
        fundDate: new Date(),
        userId: memberId,
      },
    }),
  ])

  revalidateDistributionPaths()
  return { success: true }
}

export async function updateDistributedFundTransaction(
  data: z.infer<typeof updateDistributedFundTransactionSchema>
) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can update distribution transactions" }
  }

  const result = updateDistributedFundTransactionSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { transactionId, amount, fundDate, description, paymentMode } = result.data
  const parsedFundDate = new Date(fundDate)

  if (Number.isNaN(parsedFundDate.getTime())) {
    return { error: "Invalid fund date" }
  }

  const transaction = await prisma.fund.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      amount: true,
      userId: true,
      receivedFrom: true,
      user: {
        select: {
          id: true,
          receivedAmount: true,
        },
      },
    },
  })

  if (!transaction) {
    return { error: "Transaction not found" }
  }

  if (!transaction.receivedFrom.startsWith(ADMIN_DISTRIBUTION_PREFIX)) {
    return { error: "Only admin distribution transactions can be edited" }
  }

  const amountDelta = amount - transaction.amount
  const nextReceivedAmount = Math.max(0, transaction.user.receivedAmount + amountDelta)
  const source = getDistributionSource(transaction.receivedFrom)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: transaction.userId },
      data: { receivedAmount: nextReceivedAmount },
    }),
    prisma.fund.update({
      where: { id: transactionId },
      data: {
        amount,
        fundDate: parsedFundDate,
        paymentMode,
        receivedFrom: buildDistributionReceivedFrom(source, description),
      },
    }),
  ])

  revalidateDistributionPaths()
  return { success: true }
}

export async function deleteDistributedFundTransaction(
  data: z.infer<typeof deleteDistributedFundTransactionSchema>
) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can delete distribution transactions" }
  }

  const result = deleteDistributedFundTransactionSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { transactionId } = result.data

  const transaction = await prisma.fund.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      amount: true,
      userId: true,
      receivedFrom: true,
      user: {
        select: {
          receivedAmount: true,
        },
      },
    },
  })

  if (!transaction) {
    return { error: "Transaction not found" }
  }

  if (!transaction.receivedFrom.startsWith(ADMIN_DISTRIBUTION_PREFIX)) {
    return { error: "Only admin distribution transactions can be deleted" }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: transaction.userId },
      data: {
        receivedAmount: Math.max(0, transaction.user.receivedAmount - transaction.amount),
      },
    }),
    prisma.fund.delete({
      where: { id: transactionId },
    }),
  ])

  revalidateDistributionPaths()
  return { success: true }
}

export async function getDistributedFundTransactions() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return []
  }

  return await prisma.fund.findMany({
    where: {
      receivedFrom: {
        startsWith: ADMIN_DISTRIBUTION_PREFIX,
      },
    },
    select: {
      id: true,
      amount: true,
      receivedFrom: true,
      paymentMode: true,
      fundDate: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })
  .then((transactions) =>
    transactions.map((transaction) => ({
      ...transaction,
      description: parseDistributionDescription(transaction.receivedFrom),
    }))
  )
}

export async function getAllMembers() {
  const session = await auth()
  
  if (!session?.user) {
    return []
  }

  if (session.user.role !== "ADMIN") {
    return []
  }

  return await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: {
      id: true,
      name: true,
      email: true,
      receivedAmount: true,
    },
    orderBy: { name: "asc" },
  })
}
