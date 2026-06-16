# Interactive Double-Entry Accounting Sandbox — Build Plan

A single-page PWA that teaches cash vs. accrual accounting by letting the user post real double-entry transactions and watch the books update live, with plain-English explanations for every move.

## Stack & constraints

- Vite + React + TypeScript (already the project base — TanStack Start). We'll keep one route (`src/routes/index.tsx`) and put everything client-side. **No TanStack Query, no TanStack Table.** TanStack Router stays only as the existing shell (single route).
- **Ant Design (`antd` v5)** for all UI: `Card`, `Table`, `Button`, `Segmented`, `Statistic`, `Tag`, `Steps`, `Tabs`, `Row`/`Col`, `Form`, `InputNumber`, `Modal`, `Alert`.
- Plain local state — one `useReducer` for the ledger, `useState` for form drafts. No backend, no DB, no auth. Optional `localStorage` persistence so a refresh doesn't wipe a lesson (with the Reset button clearing it).
- **PWA**: per the PWA skill, the user asked for "installable + offline-capable," so use `vite-plugin-pwa` with `generateSW`, `autoUpdate`, `NetworkFirst` for navigations, manifest + icons, and a guarded registration wrapper that refuses to register in dev / Lovable preview / iframes / `?sw=off`. Tell the user offline only works in the published app.
- **Mobile-first**: reusable `useIsMobile()` hook (`window.matchMedia('(max-width: 767px)')` + resize listener, SSR-safe). Drives layout: 3 columns on desktop (`md+`), stacked on mobile, with `Tabs` to switch Journal / Reports on small screens. Ant `Row`/`Col` with `xs={24} md={...}` spans, smaller control sizes on mobile.

## The accounting engine (the heart — must stay balanced always)

`src/lib/accounting/` — pure TS, no React:

- `types.ts`: `AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'`; `NormalSide = 'debit' | 'credit'`; `Account { code, name, type, normal }`; `JournalLine { accountCode, debit, credit }`; `JournalEntry { id, date, mode, description, plainEnglish, lines, sourceRef? }`; `Mode = 'cash' | 'accrual'`; domain objects `Invoice`, `Deposit`, `Payment`, `CreditMemo` with status fields.
- `accounts.ts`: seeded chart of accounts exactly as specified (1000, 1100, 2050, 2100, 4000, 4100, 4900, 5000, 5500) plus `3000 Owner's Equity` (needed so the balance sheet equation reads cleanly; never posted to directly, equity = retained earnings derived from P&L).
- `postEntry.ts`: single chokepoint that **asserts `sum(debits) === sum(credits)`** before accepting an entry. If unbalanced, throws — this guarantees the trial balance can never drift. All action handlers go through it.
- `balances.ts`: derive account balances by folding journal entries. Apply normal-side sign so contra accounts (Sales Discounts) and liabilities/income display naturally.
- `reports.ts`: pure selectors for **Trial Balance** (sum of debits vs credits across all accounts), **P&L** (income − contra-revenue − expenses), **Balance Sheet** (assets vs liabilities + equity, where equity = seeded equity + net income).
- `actions.ts`: one function per user action, each branching on `mode` and returning the JournalEntry(ies) + plain-English string. This is where the cash-vs-accrual divergence is encoded — kept in one file so the rules are auditable in one place.

### Actions encoded (forward + reverse)

Forward: send invoice, record payment (full/partial), take deposit, mark work complete, record expense.
Reverse: cancel unpaid invoice, issue credit memo (partial/full), refund payment, forfeit deposit, write off bad debt, apply post-send discount, void invoice (disabled when any payment exists — Ant `Tooltip` explains why).

Each action matches the exact debit/credit rules in the spec. Cash-mode no-ops (e.g. "mark work complete" in cash) still log a zero-line "informational" entry so the explanation panel can say "nothing to post in cash mode, because…".

### Preset scenarios (guided lessons, via Ant `Steps`)

`src/lib/accounting/scenarios.ts` — each preset is an array of `{ stepLabel, action, explanation }`. A "Play step" button advances one step at a time so the user reads each explanation. Presets:

(a) simple cash sale, (b) accrual invoice paid in full, (c) deposit → completion → balance paid, (d) deposit → cancellation → forfeit (the multi-step story the user called out: $1000 invoice → $300 deposit → cancel → forfeit $300 → write off $700; ends with Cash $300, Forfeited Deposit Income $300, AR $0).

(e) **Prepaid 6-month contract — the headline lesson.** $6,000 upfront. Auto-plays in BOTH modes side by side (or sequentially with a mode-flip + reset between runs). Cash: full $6,000 hits revenue in month 1. Accrual: $6,000 → Deferred Revenue (2100) on receipt, then 6 monthly entries each draining $1,000 from Deferred Revenue into Sales Revenue. A small bar list (one bar per month) renders revenue-by-month so the "spike vs. smooth" contrast is visually obvious. Built with plain divs + Ant `Progress`/`Statistic` — no chart library.

## UI layout

`src/routes/index.tsx` renders `<Sandbox />`. Components under `src/components/sandbox/`:

- `ConceptHeader.tsx` — two small Cards top of page: Cash (green accent) "money counts when it MOVES", Accrual (blue accent) "money counts when it's EARNED". Stacks on mobile.
- `ModeToggle.tsx` — Ant `Segmented` with Cash/Accrual, plus a one-sentence explainer of what changes when toggled. Does NOT rewrite history.
- `ActionsPanel.tsx` (left col / first tab on mobile) — two grouped sections: "Money In / Forward" and "Reverse / Money Back." Each button opens an Ant `Modal` with a tiny `Form` (amount, customer, target invoice select where relevant). Void button disables with tooltip when invoice has payments.
- `JournalPanel.tsx` (center col) — Ant `Table` of journal entries, newest first. Expandable row reveals the debit/credit lines and shows `Debits $X = Credits $X ✓`.
- `ReportsPanel.tsx` (right col / second tab on mobile) — Chart of Accounts table with live balances, then three sub-cards: P&L, Balance Sheet, Trial Balance (with a green `Tag` "Balanced ✓" or red "OUT OF BALANCE"; red should be impossible — it's the safety indicator).
- `ExplanationPanel.tsx` — sticky bottom (mobile) / under journal (desktop) card showing the most recent action's plain-English explanation.
- `ScenariosPanel.tsx` — Ant `Steps` per preset; "Play step" / "Play all" / "Reset & play".
- `ResetButton.tsx` — confirms then clears all entries (keeps current mode).

### Responsive structure

```text
desktop (md+):  [ Actions | Journal+Explanation | Reports ]
mobile  (xs):   ModeToggle
                ConceptHeader (stacked)
                Actions (full width)
                Tabs: [ Journal | Reports ]
                ExplanationPanel (sticky)
                Scenarios
```

`useIsMobile()` lives at `src/hooks/useIsMobile.ts`.

## State management

Single `useReducer` in `src/state/ledgerStore.tsx` (Context provider). State: `{ mode, entries, invoices, deposits, payments, creditMemos }`. Actions dispatch through `actions.ts` helpers which compute entries via the engine and append. `localStorage` sync via a small effect; Reset clears both. No TanStack, no Zustand.

## PWA wiring

- Install `vite-plugin-pwa` and `antd`.
- `vite.config.ts`: add `VitePWA({ registerType: 'autoUpdate', injectRegister: null, devOptions: { enabled: false }, workbox: { navigateFallbackDenylist: [/^\/~oauth/], runtimeCaching: [NetworkFirst for navigations, CacheFirst for hashed assets] } })`.
- `public/manifest.webmanifest` + icons (192, 512, maskable).
- `src/pwa/registerSW.ts` — guarded wrapper per the PWA skill (refuses in dev / iframe / preview hosts / `?sw=off`; unregisters stale `/sw.js` in those cases). Imported once from the client entry.
- Head tags (`manifest`, `theme-color`, `apple-touch-icon`) added in `src/routes/__root.tsx` `head()`.

## Files to add / change

- `package.json`: add `antd`, `vite-plugin-pwa`.
- `vite.config.ts`: register `VitePWA`.
- `public/manifest.webmanifest`, `public/icons/*`.
- `src/pwa/registerSW.ts`.
- `src/hooks/useIsMobile.ts`.
- `src/lib/accounting/{types,accounts,postEntry,balances,reports,actions,scenarios}.ts`.
- `src/state/ledgerStore.tsx`.
- `src/components/sandbox/*` (one file per component above).
- `src/routes/index.tsx`: replace placeholder with `<LedgerProvider><Sandbox /></LedgerProvider>` and per-route `head()` (title, meta description).
- `src/routes/__root.tsx`: add PWA head tags (keep `<Outlet />`).

## Verification

After build I'll:
1. Confirm the build succeeds with the new deps.
2. Drive the preview with Playwright to run scenario (d) and scenario (e), screenshot Trial Balance staying green at every step, and confirm final balances match the spec ($300 / $300 / $0 for d; smooth $1k/mo vs spike for e).
3. Resize viewport to 375px to confirm the three-column layout collapses into stacked + Tabs.

## Out of scope (intentionally)

- No backend, no auth, no real persistence beyond `localStorage`.
- No charting library — the monthly revenue contrast uses Ant `Progress` bars.
- No retroactive rewriting of past entries when modes flip (per spec — mode change affects future entries only).
