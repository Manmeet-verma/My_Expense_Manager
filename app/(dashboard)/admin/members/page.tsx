import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMembers } from "@/actions/auth"
import MembersContent from "./members-content"

type MemberRow = {
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  upiId: string | null
  accountNumber: string | null
  assignedProject: string[] | null
  assignedVerifierId: string | null
  assignedVerifier: {
    id: string
    name: string | null
    email: string
  } | null
  receivedAmount: number
  totalEdits: number
  createdAt: Date
  _count: {
    expenses: number
  }
}

export default async function AdminMembersPage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Auth error:", error)
    redirect("/login")
  }

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR" && session.user.role !== "VERIFIER") {
    redirect("/dashboard")
  }

  const isAdmin = session.user.role === "ADMIN"
  const isSupervisor = session.user.role === "SUPERVISOR"
  const isVerifier = session.user.role === "VERIFIER"

  let members: MemberRow[] = []
  try {
    const result = await getMembers()
    members = (result || []) as MemberRow[]
  } catch (error) {
    console.error("getMembers error:", error)
    members = []
  }

  return <MembersContent members={members} canManage={isAdmin} canDeselect={isSupervisor || isVerifier} canApproveExpenses={isSupervisor || isVerifier} />
}