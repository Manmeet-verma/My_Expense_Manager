'use server'

import { z } from "zod"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { hashPassword } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const checkAdminEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function checkIsAdminEmail(email: string) {
  const result = checkAdminEmailSchema.safeParse({ email })

  if (!result.success) {
    return { isAdmin: false }
  }

  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { role: true },
  })

  return { isAdmin: user?.role === "ADMIN" }
}

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  aadhaarNo: z.string().regex(/^\d{12}$/, "Aadhaar No must be exactly 12 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
})

const createAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  aadhaarNo: z.string().regex(/^\d{12}$/, "Aadhaar No must be exactly 12 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
})

const createSupervisorSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  aadhaarNo: z.string().regex(/^\d{12}$/, "Aadhaar No must be exactly 12 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

const adminChangePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

const adminResetMemberPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

const deleteMemberSchema = z.object({
  memberId: z.string().min(1, "Inputter ID is required"),
})

const deleteAdminSchema = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
})

const deleteSupervisorSchema = z.object({
  supervisorId: z.string().min(1, "Verifier ID is required"),
})

const updateAccountSchema = z.object({
  userId: z.string().min(1, "Account ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  aadhaarNo: z.string().regex(/^\d{12}$/, "Aadhaar No must be exactly 12 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
})

const assignMemberSchema = z.object({
  memberId: z.string().min(1, "Inputter ID is required"),
  verifierIds: z.array(z.string().min(1)).default([]),
  projectIds: z.array(z.string().min(1)).min(1, "At least one project is required"),
})

const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100, "Project name is too long"),
})

const updateProjectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().min(2, "Project name must be at least 2 characters").max(100, "Project name is too long"),
})

const deleteProjectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
})

const clearMemberAssignmentSchema = z.object({
  memberId: z.string().min(1, "Inputter ID is required"),
})

const adminForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newEmail: z.string().email("Invalid email address").optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

const publicSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  aadhaarNo: z.string().regex(/^\d{12}$/, "Aadhaar No must be exactly 12 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
})

const verifyMemberPasswordSchema = z.object({
  memberId: z.string().min(1, "Inputter ID is required"),
})
export async function signup(data: z.infer<typeof signupSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can create inputter accounts" }
  }

  const result = signupSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { email, name, fatherName, aadhaarNo, password, upiId, accountNumber } = result.data
  const normalizedEmail = email.trim().toLowerCase()

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    return { error: "Email already registered" }
  }

  const hashedPassword = await hashPassword(password)

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      fatherName,
      aadhaarNo,
      password: hashedPassword,
      role: "MEMBER",
      upiId: upiId || null,
      accountNumber: accountNumber || null,
    },
  })

  revalidatePath("/login")
  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  return { success: true }
}

export async function publicSignup(data: z.infer<typeof publicSignupSchema>) {
  try {
    const result = publicSignupSchema.safeParse(data)

    if (!result.success) {
      return { error: result.error.issues[0].message }
    }

  const { email, name, fatherName, aadhaarNo, password, upiId, accountNumber } = result.data
    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return { error: "Email already registered" }
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        fatherName,
        aadhaarNo,
        password: hashedPassword,
        role: "MEMBER",
        upiId: upiId || null,
        accountNumber: accountNumber || null,
      },
    })

    revalidatePath("/login")
    return { success: true }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "Failed to create account. Please try again." }
  }
}

export async function createAdmin(data: z.infer<typeof createAdminSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can create admin accounts" }
  }

  const result = createAdminSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { email, name, fatherName, aadhaarNo, password, upiId, accountNumber } = result.data
  const normalizedEmail = email.trim().toLowerCase()

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    return { error: "Email already registered" }
  }

  const hashedPassword = await hashPassword(password)

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      fatherName,
      aadhaarNo,
      password: hashedPassword,
      role: "ADMIN",
      upiId: upiId || null,
      accountNumber: accountNumber || null,
    },
  })

  revalidatePath("/login")
  revalidatePath("/admin")
  return { success: true }
}

export async function createProject(data: z.infer<typeof createProjectSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can create projects" }
  }

  const result = createProjectSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const normalizedName = result.data.name.trim()

  if (!prisma || !('project' in prisma)) {
    console.error('Prisma client missing `project` delegate. Did you run `prisma generate` and `prisma db push`?')
    return { error: 'Database client not initialized. Run prisma generate/push.' }
  }

  const existingProject = await prisma.project.findUnique({
    where: { name: normalizedName },
    select: { id: true },
  })

  if (existingProject) {
    return { error: "Project already exists" }
  }

  await prisma.project.create({
    data: {
      name: normalizedName,
    },
  })

  revalidatePath("/admin/assignments")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin")
  return { success: true }
}

export async function updateProject(data: z.infer<typeof updateProjectSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can edit projects" }
  }

  const result = updateProjectSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { projectId, name } = result.data
  const normalizedName = name.trim()

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  })

  if (!project) {
    return { error: "Project not found" }
  }

  const duplicate = await prisma.project.findUnique({
    where: { name: normalizedName },
    select: { id: true },
  })

  if (duplicate && duplicate.id !== projectId) {
    return { error: "Project already exists" }
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { name: normalizedName },
    })

    await tx.$executeRaw`
      UPDATE "User"
      SET "assignedProject" = array_replace("assignedProject", ${project.name}, ${normalizedName})
      WHERE ${project.name} = ANY("assignedProject")
    `
  })

  revalidatePath("/admin/assignments")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteProject(data: z.infer<typeof deleteProjectSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can delete projects" }
  }

  const result = deleteProjectSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { projectId } = result.data

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  })

  if (!project) {
    return { error: "Project not found" }
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "User"
      SET "assignedProject" = array_remove("assignedProject", ${project.name})
      WHERE ${project.name} = ANY("assignedProject")
    `

    await tx.project.delete({
      where: { id: projectId },
    })
  })

  revalidatePath("/admin/assignments")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function getProjects() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return []
  }

  if (!prisma || !('project' in prisma)) {
    console.error('Prisma client missing `project` delegate in getProjects()')
    return []
  }

  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function createSupervisor(data: z.infer<typeof createSupervisorSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can create verifier accounts" }
  }

  const result = createSupervisorSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { email, name, fatherName, aadhaarNo, password, upiId, accountNumber } = result.data
  const normalizedEmail = email.trim().toLowerCase()

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    return { error: "Email already registered" }
  }

  const hashedPassword = await hashPassword(password)

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      fatherName,
      aadhaarNo,
      password: hashedPassword,
      role: "SUPERVISOR",
      upiId: upiId || null,
      accountNumber: accountNumber || null,
    },
  })

  revalidatePath("/login")
  revalidatePath("/admin")
  revalidatePath("/admin/members")
  revalidatePath("/admin/create-supervisor")
  return { success: true }
}

export async function changeMyPassword(data: z.infer<typeof changePasswordSchema>) {
  const session = await auth()

  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  const result = changePasswordSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { currentPassword, newPassword } = result.data

  if (currentPassword === newPassword) {
    return { error: "New password must be different from current password" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user) {
    return { error: "User not found" }
  }

  const isCurrentPasswordValid = await compare(currentPassword, user.password)

  if (!isCurrentPasswordValid) {
    return { error: "Current password is incorrect" }
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")

  return { success: true }
}

export async function adminChangePassword(data: z.infer<typeof adminChangePasswordSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can use this feature" }
  }

  const result = adminChangePasswordSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { newPassword } = result.data
  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin")

  return { success: true }
}

export async function adminResetMemberPassword(data: z.infer<typeof adminResetMemberPasswordSchema>) {
  const session = await auth()

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return { error: "Only admins and verifiers can reset inputter passwords" }
  }

  const result = adminResetMemberPasswordSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { email, newPassword } = result.data
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, role: true, password: true },
  })

  if (!user) {
    return { error: "Inputter account not found" }
  }

  if (user.role !== "MEMBER") {
    return { error: "Admin can reset only inputter passwords" }
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  revalidatePath("/admin")

  return { success: true }
}

export async function verifyMemberPassword(
  data: z.infer<typeof verifyMemberPasswordSchema>
) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can verify inputter passwords" }
  }

  const result = verifyMemberPasswordSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { memberId } = result.data

  const user = await prisma.user.findUnique({
    where: { id: memberId },
    select: { id: true, email: true, role: true, password: true },
  })

  if (!user) {
    return { error: "Inputter not found" }
  }

  if (user.role !== "MEMBER") {
    return { error: "This is not an inputter account" }
  }

  return {
    success: true,
    hasPassword: !!user.password,
    passwordType: user.password ? "hashed" : "none",
    email: user.email,
    message: user.password
      ? "✓ Inputter has a valid password"
      : "✗ Inputter has no password - ask admin to reset it",
  }
}

export async function getMembers(): Promise<{
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  assignedProject: string[]
  assignedVerifierIds: string[]
  assignedVerifierId: string | null
  assignedVerifier: {
    id: string
    name: string | null
    email: string
  } | null
  receivedAmount: number
  createdAt: Date
  _count: {
    expenses: number
  }
  totalEdits: number
}[]> {
  const session = await auth()

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR" && session.user.role !== "VERIFIER")) {
    return []
  }

  const whereClause =
    session.user.role === "SUPERVISOR" || session.user.role === "VERIFIER"
      ? { role: "MEMBER" as const, assignedVerifierId: session.user.id }
      : { role: "MEMBER" as const }

  const members = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      fatherName: true,
      aadhaarNo: true,
      email: true,
      assignedProject: true,
      assignedVerifierIds: true,
      assignedVerifierId: true,
      assignedVerifier: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      receivedAmount: true,
      createdAt: true,
      expenses: {
        select: {
          editCount: true,
        },
      },
      _count: {
        select: {
          expenses: true,
        },
      },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  })

  return members.map((member) => ({
    id: member.id,
    name: member.name,
    fatherName: member.fatherName,
    aadhaarNo: member.aadhaarNo,
    email: member.email,
    assignedProject: Array.isArray(member.assignedProject)
      ? member.assignedProject
      : member.assignedProject
        ? [member.assignedProject]
        : [],
    assignedVerifierIds: Array.isArray(member.assignedVerifierIds)
      ? member.assignedVerifierIds
      : member.assignedVerifierIds
        ? [member.assignedVerifierIds]
        : member.assignedVerifierId
          ? [member.assignedVerifierId]
          : [],
    assignedVerifierId: member.assignedVerifierId,
    assignedVerifier: member.assignedVerifier,
    receivedAmount: member.receivedAmount,
    createdAt: member.createdAt,
    _count: member._count,
    totalEdits: member.expenses.reduce((sum, expense) => sum + expense.editCount, 0),
  }))
}

export async function assignMemberToVerifier(data: z.infer<typeof assignMemberSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can assign inputters" }
  }

  const result = assignMemberSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { memberId, verifierIds, projectIds } = result.data
  const normalizedVerifierIds = Array.from(new Set(verifierIds.map((verifierId) => verifierId.trim()).filter(Boolean)))
  const normalizedProjectIds = Array.from(new Set(projectIds.map((projectId) => projectId.trim()).filter(Boolean)))

  const [member, projects] = await Promise.all([
    prisma.user.findUnique({ where: { id: memberId }, select: { id: true, role: true } }),
    prisma.project.findMany({ where: { id: { in: normalizedProjectIds } }, select: { id: true, name: true } }),
  ])

  if (!member || member.role !== "MEMBER") {
    return { error: "Inputter not found" }
  }

  if (projects.length !== normalizedProjectIds.length) {
    return { error: "One or more projects were not found" }
  }

  if (normalizedVerifierIds.length > 0) {
    const verifiers = await prisma.user.findMany({
      where: { id: { in: normalizedVerifierIds } },
      select: { id: true, role: true },
    })

    if (verifiers.length !== normalizedVerifierIds.length || verifiers.some((currentVerifier) => currentVerifier.role !== "SUPERVISOR" && currentVerifier.role !== "VERIFIER")) {
      return { error: "Verifier not found" }
    }
  }

  const orderedProjectNames = normalizedProjectIds
    .map((projectId) => projects.find((project) => project.id === projectId)?.name)
    .filter((name): name is string => Boolean(name))

  await prisma.$executeRaw`
    UPDATE "User"
    SET
      "assignedVerifierIds" = ${normalizedVerifierIds}::text[],
      "assignedVerifierId" = ${normalizedVerifierIds[0] ?? null},
      "assignedProject" = ${orderedProjectNames}::text[]
    WHERE "id" = ${memberId}
  `

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/members")
  revalidatePath("/dashboard")

  return { success: true }
}

export async function clearMemberAssignment(data: z.infer<typeof clearMemberAssignmentSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can clear assignments" }
  }

  const result = clearMemberAssignmentSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { memberId } = result.data

  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { id: true, role: true },
  })

  if (!member || member.role !== "MEMBER") {
    return { error: "Inputter not found" }
  }

  await prisma.$executeRaw`
    UPDATE "User"
    SET
      "assignedVerifierIds" = '{}'::text[],
      "assignedVerifierId" = NULL,
      "assignedProject" = '{}'::text[]
    WHERE "id" = ${memberId}
  `

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/members")
  revalidatePath("/dashboard")

  return { success: true }
}

export async function getMyAssignment() {
  const session = await auth()

  if (!session?.user || session.user.role !== "MEMBER") {
    return null
  }

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      assignedProject: true,
      assignedVerifier: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return member
}

export async function getAdmins() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return []
  }

  return prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      name: true,
      fatherName: true,
      aadhaarNo: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function getSupervisors() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return []
  }

  return prisma.user.findMany({
    where: { role: "SUPERVISOR" },
    select: {
      id: true,
      name: true,
      fatherName: true,
      aadhaarNo: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function deleteAdmin(data: z.infer<typeof deleteAdminSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can delete admin accounts" }
  }

  const result = deleteAdminSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { adminId } = result.data

  if (adminId === session.user.id) {
    return { error: "You cannot delete your own account" }
  }

  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, role: true },
  })

  if (!user) {
    return { error: "Admin not found" }
  }

  if (user.role !== "ADMIN") {
    return { error: "Only admin accounts can be deleted" }
  }

  await prisma.user.delete({
    where: { id: adminId },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")

  return { success: true }
}

export async function deleteSupervisor(data: z.infer<typeof deleteSupervisorSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can delete verifier accounts" }
  }

  const result = deleteSupervisorSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { supervisorId } = result.data

  const user = await prisma.user.findUnique({
    where: { id: supervisorId },
    select: { id: true, role: true },
  })

  if (!user) {
    return { error: "Verifier not found" }
  }

  if (user.role !== "SUPERVISOR") {
    return { error: "Only verifier accounts can be deleted" }
  }

  await prisma.user.delete({
    where: { id: supervisorId },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/members")
  revalidatePath("/admin/create-supervisor")

  return { success: true }
}

export async function deleteMember(data: z.infer<typeof deleteMemberSchema>) {
  const session = await auth()

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return { error: "Only admins or verifiers can delete inputter accounts" }
  }

  const result = deleteMemberSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { memberId } = result.data

  if (memberId === session.user.id) {
    return { error: "You cannot delete your own account" }
  }

  const user = await prisma.user.findUnique({
    where: { id: memberId },
    select: { id: true, role: true },
  })

  if (!user) {
    return { error: "Inputter not found" }
  }

  if (user.role !== "MEMBER") {
    return { error: "Only inputter accounts can be deleted" }
  }

  await prisma.user.delete({
    where: { id: memberId },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/members")

  return { success: true }
}

export async function updateAccount(data: z.infer<typeof updateAccountSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can edit accounts" }
  }

  const result = updateAccountSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { userId, name, email, fatherName, aadhaarNo, newPassword } = result.data
  const normalizedEmail = email.trim().toLowerCase()

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!existingUser) {
    return { error: "Account not found" }
  }

  const duplicateEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })

  if (duplicateEmail && duplicateEmail.id !== userId) {
    return { error: "Email already registered" }
  }

  const dataToUpdate: {
    name: string
    email: string
    fatherName: string
    aadhaarNo: string
    password?: string
  } = {
    name: name.trim(),
    email: normalizedEmail,
    fatherName: fatherName.trim(),
    aadhaarNo: aadhaarNo.trim(),
  }

  if (newPassword && newPassword.trim()) {
    dataToUpdate.password = await hashPassword(newPassword.trim())
  }

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  })

  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/members")
  revalidatePath("/admin/create-supervisor")
  revalidatePath("/admin/create-account")
  revalidatePath("/admin/verify-members")

  return { success: true }
}

export async function adminForgotPassword(data: z.infer<typeof adminForgotPasswordSchema>) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Only admins can reset their password" }
  }

  const result = adminForgotPasswordSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { email, newPassword } = result.data
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail !== session.user.email) {
    return { error: "You can only reset your own password" }
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, role: true },
  })

  if (!user || user.role !== "ADMIN") {
    return { error: "Admin account not found" }
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  revalidatePath("/dashboard")

  return { success: true }
}

export async function forgotPassword(data: z.infer<typeof forgotPasswordSchema>) {
  const result = forgotPasswordSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { email, newEmail, newPassword } = result.data
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, role: true },
  })

  if (!user) {
    return { error: "User not found" }
  }

  const updateData: { password: string; email?: string } = {
    password: await hashPassword(newPassword),
  }

  if (newEmail && newEmail.trim()) {
    const normalizedNewEmail = newEmail.trim().toLowerCase()
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedNewEmail },
    })

    if (existingEmail) {
      return { error: "New email already in use" }
    }

    updateData.email = normalizedNewEmail
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  })

  revalidatePath("/login")

  return { success: true }
}
