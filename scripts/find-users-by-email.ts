import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const query = process.argv[2]

  if (!query) {
    console.error("Usage: npx tsx scripts/find-users-by-email.ts <partial-email>")
    process.exit(1)
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  })

  console.log(JSON.stringify({ query, count: users.length, users }, null, 2))

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
