# Vyapaar Set Go Build Plan

## Milestone 1: Project shell and contracts

- Create Next.js App Router + TypeScript + Tailwind project files.
- Add `AGENTS.md` with the signed-balance ledger contract.
- Acceptance command: `npm install`

## Milestone 2: Balance engine

- Implement deterministic customer and supplier balance helpers.
- Add Vitest coverage for pure udhaar, exact payment, overpayment to advance, and advance drawdown.
- Acceptance command: `npm test`

## Milestone 3: Database and seed data

- Add Prisma Postgres schema, client setup, first-run seed script, and server actions.
- Seed 6-8 customers, 2-3 suppliers, and 15-20 transactions across the last 7 days.
- Acceptance command: `npm run prisma:generate && npm run seed`

## Milestone 4: MVP screens

- Build Dashboard, Customers, Customer Detail, Suppliers, Supplier Detail, and Daily Hisaab screens.
- Keep UI mobile-first, large tap targets, high contrast, Hinglish labels, INR formatting, and IST dates.
- Acceptance command: `npm run typecheck`

## Milestone 5: Smoke test and deploy docs

- Add Playwright smoke test for customer creation, udhaar entry, overpayment, and advance flip.
- Add README, `.env.example`, MIT license, and Vercel + Neon deployment instructions.
- Acceptance command: `npm run build && npm test`

## Milestone 6: Final validation and commits

- Run dev server, tests, typecheck, build, and self-review diff.
- Commit incremental work with `Codex <codex@openai.com>` author.
- Acceptance command: `git log --oneline --decorate -5`

## Milestone 7: Quick Entry natural-language box

- Add a deterministic rule/regex parser for Hinglish one-line entries (`lib/quick-entry.ts`), matched
  against known customers first, with Vitest coverage.
- Add an optional LLM fallback (`lib/quick-entry-llm.ts`) used only when the deterministic parser is
  incomplete and `OPENAI_API_KEY` is set; no-ops cleanly without a key.
- Wire `parseQuickEntry` / `confirmQuickEntry` server actions and a Dashboard `QuickEntry` component
  that shows a confirmation card (with inline "create this customer" option) before writing anything.
- Acceptance command: `npm test && npm run typecheck`
