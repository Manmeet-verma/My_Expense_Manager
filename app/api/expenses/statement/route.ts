import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function getLocalDayStart(dateString: string) {
  return new Date(`${dateString}T00:00:00`)
}

function getLocalDayEnd(dateString: string) {
  return new Date(`${dateString}T23:59:59.999`)
}

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const fromDate = searchParams.get("fromDate")
  const toDate = searchParams.get("toDate")
  const status = searchParams.get("status")
  const userId = searchParams.get("userId")

  if (!fromDate || !toDate || !status) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    // Only allow userId parameter if user is admin or supervisor
    const requestedUserId = userId && (session.user.role === "ADMIN" || session.user.role === "SUPERVISOR") 
      ? userId 
      : session.user.id

    // Validate status is a valid enum value
    const validStatuses = ["APPROVED", "REJECTED", "PENDING", "PAID"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 })
    }

    const fromDateTime = getLocalDayStart(fromDate)
    const toDateTime = getLocalDayEnd(toDate)

    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: fromDateTime,
          lte: toDateTime,
        },
        status: status as "APPROVED" | "REJECTED" | "PENDING" | "PAID",
        createdById: requestedUserId,
      },
      include: {
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Failed to fetch expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}
