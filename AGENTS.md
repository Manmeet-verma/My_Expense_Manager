<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project-specific conventions

## Dev server
- CPU does NOT support BMI2 instructions — Turbopack (the default bundler in Next.js 16) will crash with `CPU doesn't support the bmi2 instructions`.
- Always use `--webpack` flag: `npx next dev --webpack -p 3000`
- Avoid mixing Turbopack and webpack caches — delete `.next` entirely when switching.

## Prisma
- Uses Prisma v7 with `prisma.config.ts` configuration.
- Run `npx prisma generate` after schema changes.
- Run `npx prisma db push` to sync schema to the database.
- `DATABASE_URL` uses pgbouncer (port 6543), `DIRECT_URL` uses direct (port 5432).

## TypeScript
- `npx next typegen` to regenerate route types before `tsc --noEmit`.
- Auto-generated `.next/types/` may have `searchParams` constraint errors — these are harmless.
