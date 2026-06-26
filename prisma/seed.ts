import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { hash } from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create supervisor user
  const supervisorPassword = await hash('supervisor123', 12)
  await prisma.user.upsert({
    where: { email: 'supervisor@example.com' },
    update: {
      name: 'Supervisor User',
      password: supervisorPassword,
      role: 'SUPERVISOR',
    },
    create: {
      email: 'supervisor@example.com',
      name: 'Supervisor User',
      password: supervisorPassword,
      role: 'SUPERVISOR',
    },
  })

  const defaultCategories = [
    { name: 'Freight/Gaddi', description: 'Freight/Gaddi expenses' },
    { name: 'Porter', description: 'Porter expenses' },
    { name: 'Food', description: 'Food and meals' },
    { name: 'Office Goods', description: 'Office goods and supplies' },
    { name: 'Hotel', description: 'Hotel and stay expenses' },
    { name: 'Fuel', description: 'Fuel expenses' },
  ]

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    })
  }

  console.log('Seed completed!')
  console.log('')
  console.log('Demo Accounts Created:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin Account:')
  console.log('  Email: admin@example.com')
  console.log('  Password: admin123')
  console.log('')
  console.log('Supervisor Account:')
  console.log('  Email: supervisor@example.com')
  console.log('  Password: supervisor123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Default Categories Seeded: 6')

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
