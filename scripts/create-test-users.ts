import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { hash } from "bcryptjs"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const users = [
  {
    email: "admin@test.com",
    name: "Test Admin",
    password: "Admin@123",
    role: "ADMIN" as const,
  },
  {
    email: "supervisor@test.com",
    name: "Test Supervisor",
    password: "Supervisor@123",
    role: "SUPERVISOR" as const,
  },
  {
    email: "member@test.com",
    name: "Test Member",
    password: "Member@123",
    role: "MEMBER" as const,
  },
]

async function main() {
  for (const user of users) {
    const passwordHash = await hash(user.password, 12)

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: passwordHash,
        role: user.role,
      },
      create: {
        email: user.email,
        name: user.name,
        password: passwordHash,
        role: user.role,
      },
    })
  }

  console.log("Created or updated test users:")
  console.log("ADMIN      admin@test.com      Admin@123")
  console.log("SUPERVISOR supervisor@test.com Supervisor@123")
  console.log("MEMBER     member@test.com     Member@123")
}

main()
  .catch(async (error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
