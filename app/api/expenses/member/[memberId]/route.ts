import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ExpenseStatus } from "@prisma/client"

type RouteContext = {
  params: Promise<{
    memberId: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR" && session.user.role !== "VERIFIER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { memberId } = await context.params

    if (!memberId) {
      return NextResponse.json({ error: "Inputter ID is required" }, { status: 400 })
    }

    const allowedStatuses: ExpenseStatus[] = ["APPROVED", "REJECTED", "PENDING", "PAID"]

    const isAll = memberId === "all"

    const baseFilter =
      session.user.role === "ADMIN"
        ? {}
        : { createdBy: { assignedVerifierId: session.user.id } }

    const whereClause = isAll
      ? {
          ...baseFilter,
          status: { in: allowedStatuses },
        }
      : {
          createdById: memberId,
          ...(session.user.role !== "ADMIN" ? { createdBy: { assignedVerifierId: session.user.id } } : {}),
          status: { in: allowedStatuses },
        }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        category: true,
        status: true,
        createdAt: true,
        adminRemark: true,
        approvedByName: true,
        approvedByRole: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
    })

    const approved = expenses.filter((expense) => expense.status === "APPROVED")
    const rejected = expenses.filter((expense) => expense.status === "REJECTED")
    const pending = expenses.filter((expense) => expense.status === "PENDING")
    const paid = expenses.filter((expense) => expense.status === "PAID")

    let totalBudget = 0
    let receivedAmount = 0
    let totalCollectionFunds = 0

    if (isAll) {
      const memberIds = session.user.role === "ADMIN"
        ? await prisma.user.findMany({ where: { role: "MEMBER" }, select: { id: true } })
        : await prisma.user.findMany({ where: { role: "MEMBER", assignedVerifierId: session.user.id }, select: { id: true } })

      const ids = memberIds.map((m) => m.id)

      const [budgetSum, funds] = await Promise.all([
        prisma.user.aggregate({ where: { id: { in: ids } }, _sum: { totalBudget: true, receivedAmount: true } }),
        prisma.fund.aggregate({ where: { userId: { in: ids }, status: "APPROVED" }, _sum: { amount: true } }),
      ])

      totalBudget = budgetSum._sum.totalBudget || 0
      receivedAmount = budgetSum._sum.receivedAmount || 0
      totalCollectionFunds = funds._sum.amount || 0
    } else {
      const member = await prisma.user.findUnique({
        where: { id: memberId },
        select: { totalBudget: true, receivedAmount: true },
      })

      const allFunds = await prisma.fund.findMany({
        where: { userId: memberId, status: "APPROVED" },
        select: { amount: true },
      })

      totalBudget = member?.totalBudget || 0
      receivedAmount = member?.receivedAmount || 0
      totalCollectionFunds = allFunds.reduce((sum, f) => sum + f.amount, 0)
    }

    return NextResponse.json({
      approved,
      rejected,
      pending,
      paid,
      totalBudget,
      receivedAmount,
      totalCollectionFunds,
    })
  } catch (error) {
    console.error("Failed to fetch inputter expenses:", error)
    return NextResponse.json({ error: "Failed to fetch inputter expenses" }, { status: 500 })
  }
}
