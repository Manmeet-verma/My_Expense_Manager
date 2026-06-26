-- Run in Supabase SQL Editor

-- Enums
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'TRAVEL', 'TRANSPORTATION', 'ACCOMMODATION', 'OFFICE_SUPPLIES', 'COMMUNICATION', 'ENTERTAINMENT', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User Table
CREATE TABLE "User" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, "email" TEXT UNIQUE NOT NULL, "name" TEXT, "password" TEXT NOT NULL, "role" "Role" DEFAULT 'MEMBER', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

-- Expense Table
CREATE TABLE "Expense" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, "title" TEXT NOT NULL, "description" TEXT, "amount" DOUBLE PRECISION NOT NULL, "category" "ExpenseCategory" NOT NULL, "status" "ExpenseStatus" DEFAULT 'PENDING', "adminRemark" TEXT, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "createdById" TEXT REFERENCES "User"("id") ON DELETE CASCADE);
