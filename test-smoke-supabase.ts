import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { hash } from "bcryptjs"

type LoginResult = {
  ok: boolean
  status: number
  body: string
}

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function parseSetCookies(headers: Headers): string {
  const raw = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() || []
  if (raw.length === 0) return ""
  return raw.map((c) => c.split(";")[0]).join("; ")
}

async function getCsrfCookieAndToken(): Promise<{ token: string; cookie: string }> {
  const res = await fetch(`${baseUrl}/api/auth/csrf`)
  const json = await res.json() as { csrfToken: string }
  const cookie = parseSetCookies(res.headers)

  if (!json.csrfToken) {
    throw new Error("Failed to get CSRF token")
  }

  return { token: json.csrfToken, cookie }
}

async function loginWithCredentials(email: string, password: string): Promise<LoginResult> {
  const { token, cookie } = await getCsrfCookieAndToken()
  const form = new URLSearchParams({
    csrfToken: token,
    email,
    password,
    callbackUrl: `${baseUrl}/dashboard`,
    json: "true",
  })

  const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie,
    },
    body: form.toString(),
    redirect: "manual",
  })

  const body = await res.text()
  const ok = res.status === 200 && body.includes("\"url\"") && !body.includes("error=")

  return { ok, status: res.status, body }
}

async function run() {
  const stamp = Date.now()
  const memberEmail = `smoke.member.${stamp}@example.com`
  const memberPassword = `Smoke${stamp}`
  const memberName = `Smoke Member ${stamp}`

  try {
    console.log("1) Admin creates member (server-equivalent write to Supabase)")
    const hashedPassword = await hash(memberPassword, 12)

    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        name: memberName,
        password: hashedPassword,
        role: "MEMBER",
      },
      select: { id: true, email: true },
    })

    console.log(`   Created member: ${member.email}`)

    console.log("2) Member login with email/password through NextAuth API")
    const login = await loginWithCredentials(memberEmail, memberPassword)
    if (!login.ok) {
      throw new Error(`Login failed. status=${login.status} body=${login.body.slice(0, 300)}`)
    }
    console.log("   Login success")

    console.log("3) Member creates expense (stored in Supabase)")
    const created = await prisma.expense.create({
      data: {
        title: "Smoke Expense",
        description: "Created by smoke test",
        amount: 100,
        category: "FOOD",
        createdById: member.id,
      },
      select: { id: true, amount: true, editCount: true },
    })

    console.log(`   Created expense: ${created.id} amount=${created.amount} editCount=${created.editCount}`)

    console.log("4) Member edits expense (increment edit count)")
    const updated = await prisma.expense.update({
      where: { id: created.id },
      data: {
        amount: 150,
        description: "Edited by smoke test",
        editCount: { increment: 1 },
      },
      select: { id: true, amount: true, editCount: true, description: true },
    })

    console.log(`   Updated expense: ${updated.id} amount=${updated.amount} editCount=${updated.editCount}`)

    console.log("5) Verify row exists in Supabase with expected values")
    const verified = await prisma.expense.findUnique({
      where: { id: created.id },
      select: { id: true, amount: true, editCount: true, description: true, createdById: true },
    })

    if (!verified) {
      throw new Error("Verification failed: expense row not found")
    }

    if (verified.amount !== 150 || verified.editCount < 1) {
      throw new Error(`Verification failed: unexpected values amount=${verified.amount} editCount=${verified.editCount}`)
    }

    console.log("   Verification success")
    console.log("\nSmoke test PASSED")
    console.log(`Member email: ${memberEmail}`)
    console.log(`Member password: ${memberPassword}`)
    console.log(`Expense id: ${verified.id}`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("Smoke test FAILED")
  console.error(err)
  process.exit(1)
})
