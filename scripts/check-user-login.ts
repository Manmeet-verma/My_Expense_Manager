import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { compare } from "bcryptjs"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/check-user-login.ts <email> <password>")
    process.exit(1)
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      createdAt: true,
    },
  })

  if (!user) {
    console.log(JSON.stringify({ found: false, reason: "User not found" }, null, 2))
    await prisma.$disconnect()
    return
  }

  const storedPassword = user.password ?? ""
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword)

  const passwordMatches = storedPassword
    ? isBcryptHash
      ? await compare(password, storedPassword)
      : password === storedPassword
    : false

  console.log(
    JSON.stringify(
      {
        found: true,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        passwordLength: storedPassword.length,
        isBcryptHash,
        passwordMatches,
      },
      null,
      2
    )
  )

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
