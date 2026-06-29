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

    const whereClause =
      session.user.role === "ADMIN"
        ? {
            createdById: memberId,
            status: {
              in: allowedStatuses,
            },
          }
        : {
            createdById: memberId,
            createdBy: {
              assignedVerifierId: session.user.id,
            },
            status: {
              in: allowedStatuses,
            },
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

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        totalBudget: true,
        receivedAmount: true,
      },
    })

    const allFunds = await prisma.fund.findMany({
      where: {
        userId: memberId,
        status: "APPROVED",
      },
      select: { amount: true },
    })

    const totalCollectionFunds = allFunds.reduce((sum, f) => sum + f.amount, 0)
    const totalBudget = member?.totalBudget || 0
    const receivedAmount = member?.receivedAmount || 0

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
