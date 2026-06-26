import { Role } from "@/lib/types"

export type DemoLoginAccount = {
  role: Role
  email: string
  password: string
  destination: "/admin" | "/dashboard"
  description: string
}

export const demoLoginAccounts = [
  {
    role: Role.ADMIN,
    email: "admin@test.com",
    password: "Admin@123",
    destination: "/admin",
    description: "Manage users, funds, and expense approvals.",
  },
  {
    role: Role.SUPERVISOR,
    email: "supervisor@test.com",
    password: "Supervisor@123",
    destination: "/admin",
    description: "Review and approve team activity from the admin workspace.",
  },
  {
    role: Role.MEMBER,
    email: "member@test.com",
    password: "Member@123",
    destination: "/dashboard",
    description: "Submit expenses and follow your own dashboard.",
  },
] as const satisfies readonly DemoLoginAccount[]
