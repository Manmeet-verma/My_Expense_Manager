export const Role = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  VERIFIER: "VERIFIER",
  MEMBER: "MEMBER",
} as const

export type Role = (typeof Role)[keyof typeof Role]

export type ExpenseCategory = string

export const ExpenseStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
} as const

export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus]
