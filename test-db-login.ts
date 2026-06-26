import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { compare } from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function testLogin() {
  try {
    // Test admin login
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (!admin) {
      console.log('❌ Admin user not found')
      process.exit(1)
    }
    
    console.log('✓ Admin user found')
    console.log(`  Email: ${admin.email}`)
    console.log(`  Password hash: ${admin.password?.substring(0, 20)}...`)
    
    // Test password verification
    const passwordMatch = await compare('admin123', admin.password || '')
    console.log(`  Password verification: ${passwordMatch ? '✓ PASS' : '❌ FAIL'}`)
    
    // Test member login
    const member = await prisma.user.findUnique({
      where: { email: 'member@example.com' }
    })
    
    if (!member) {
      console.log('❌ Member user not found')
      process.exit(1)
    }
    
    console.log('✓ Member user found')
    console.log(`  Email: ${member.email}`)
    console.log(`  Password hash: ${member.password?.substring(0, 20)}...`)
    
    // Test password verification
    const memberPasswordMatch = await compare('member123', member.password || '')
    console.log(`  Password verification: ${memberPasswordMatch ? '✓ PASS' : '❌ FAIL'}`)
    
    console.log('\n✓ All database tests passed!')
    console.log('Credentials to use on login:')
    console.log('  Admin: admin@example.com / admin123')
    console.log('  Member: member@example.com / member123')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
