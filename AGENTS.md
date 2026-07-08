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

## Relevant Files
- `actions/auth.ts`: `signupSchema` (line 31), `signup` function (line 145), `updateAccountSchema`/`updateAccount` (lines 1027+), `getMembers` (line 648)
- `components/forms/signup-form.tsx`: Create inputter form — updated with project/verifier/opening balance
- `components/forms/edit-account-form.tsx`: Edit account form — updated with opening balance field
- `app/(dashboard)/admin/create-inputter/page.tsx`: Create inputter page — fetches `projects` and `verifiers`, passes to `<SignupForm />`
- `app/(dashboard)/admin/members/page.tsx`: MemberRow type includes `totalBudget`
- `app/(dashboard)/admin/members/members-content.tsx`: MemberRow interface & EditAccountForm updated with `totalBudget`
- `app/(dashboard)/admin/page.tsx`: MemberRow type includes `totalBudget`
- `components/dashboard-member-view.tsx`: Dynamic opening balance = `totalBudget + pre-date funds - pre-date expenses`
- `components/supervisor-inputter-filter.tsx`: Dynamic opening balance (same formula), date-filtered fund amounts
- `app/api/expenses/member/[memberId]/route.ts`: Returns `funds` array with dates for dynamic OB calculation
- `components/admin-expense-management-table.tsx`: Already defaults to today, ledger-based opening balance

## Key Behaviors
- Expense cards default to today's date (already implemented in all views)
- Opening Balance card shows: day 1 = admin-set `totalBudget`, subsequent days = previous day's closing balance
- Calculated as: `totalBudget + sum(funds before today) - sum(expenses before today)`
- Closing balance = `openingBalance + within-day funds - within-day paid expenses`
- Date range filter available to view any day's data
