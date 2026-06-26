import { NextResponse } from "next/server"
import { getApprovedExpenses } from "@/actions/expense"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const expenses = await getApprovedExpenses()
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Failed to fetch approved expenses:", error)
    return NextResponse.json({ error: "Failed to fetch approved expenses" }, { status: 500 })
  }
}
