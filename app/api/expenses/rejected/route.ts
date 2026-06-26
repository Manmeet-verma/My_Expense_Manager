import { NextResponse } from "next/server"
import { getRejectedExpenses } from "@/actions/expense"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const expenses = await getRejectedExpenses()
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Failed to fetch rejected expenses:", error)
    return NextResponse.json({ error: "Failed to fetch rejected expenses" }, { status: 500 })
  }
}
