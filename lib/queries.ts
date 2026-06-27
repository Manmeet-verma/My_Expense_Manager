import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
