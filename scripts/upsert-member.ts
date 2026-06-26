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

async function main() {
  const emailArg = process.argv[2]
  const passwordArg = process.argv[3]
  const nameArg = process.argv[4] ?? "Manmeet"

  if (!emailArg || !passwordArg) {
    console.error("Usage: npx tsx scripts/upsert-member.ts <email> <password> [name]")
    process.exit(1)
  }

  const email = emailArg.trim().toLowerCase()
  const passwordHash = await hash(passwordArg, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: nameArg,
      password: passwordHash,
      role: "MEMBER",
    },
    create: {
      email,
      name: nameArg,
      password: passwordHash,
      role: "MEMBER",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  console.log(JSON.stringify({ ok: true, user }, null, 2))

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
