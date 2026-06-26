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
  const userId = searchParams.get("userId")

  try {
    // Only allow userId parameter if user is admin or supervisor
    const requestedUserId = userId && (session.user.role === "ADMIN" || session.user.role === "SUPERVISOR") 
      ? userId 
      : session.user.id

    let funds

    if (fromDate && toDate) {
      const fromDateTime = getLocalDayStart(fromDate)
      const toDateTime = getLocalDayEnd(toDate)

      funds = await prisma.fund.findMany({
        where: {
          fundDate: {
            gte: fromDateTime,
            lte: toDateTime,
          },
          userId: requestedUserId,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    } else {
      funds = await prisma.fund.findMany({
        where: {
          userId: requestedUserId,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    }

    return NextResponse.json(funds)
  } catch (error) {
    console.error("Failed to fetch funds:", error)
    return NextResponse.json({ error: "Failed to fetch funds" }, { status: 500 })
  }
}
