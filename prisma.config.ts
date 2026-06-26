import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    // For db push/migrate: prefer DIRECT_URL (port 5432)
    // For app runtime: falls back to DATABASE_URL (port 6543 with pgbouncer)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
