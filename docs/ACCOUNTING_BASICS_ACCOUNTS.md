# Accounting Basics — Account Reference (for the interactive lesson)

**Purpose:** the data behind an **Accounting Basics** tab. The goal is for Ruthnie to build a
*mental model*, not memorize. Keep it interactive and light — let her click/drag/match accounts
and feel which ones pair and which never do. The words below are reference; the UI should be the
teacher.

---

## The ONE rule everything hangs on (lead with this, make it visual)

Every account has a "home side" — the direction it **goes UP**:

- **Assets** and **Expenses** → home side is **DEBIT**. A debit makes them go up; a credit makes them go down.
- **Liabilities, Equity, and Income** → home side is **CREDIT**. A credit makes them go up; a debit makes them go down.

That's it. Every transaction is just **one account goes up, and another moves to balance it** —
total debits always equal total credits. If the learner internalizes only this, they can *derive*
every entry instead of memorizing.

**Interactive idea:** show the two "sides" as two zones (Debit zone / Credit zone). Let the user
drag each account into the zone they think is its home. Snap + green check if right; gentle
bounce-back + a one-line hint if wrong. That single exercise teaches the whole rule by feel.

---

## The accounts to teach (the simplified teaching set)

| Account | Type | Home side (goes UP with) | One-line meaning |
|---|---|---|---|
| Cash | Asset | **Debit** | Money you actually have, on hand or in the bank. |
| Accounts Receivable | Asset | **Debit** | Money customers owe you but haven't paid yet. |
| Customer Deposits | Liability | **Credit** | Money a customer paid up front before you did the work — you "owe" them the work. |
| Deferred Revenue | Liability | **Credit** | Money paid up front for work spread over time — earned bit by bit. |
| Accounts Payable | Liability | **Credit** | Money YOU owe a vendor/supplier but haven't paid yet. |
| Owner's Equity | Equity | **Credit** | What the owner has put into (or built up in) the business. |
| Sales Revenue | Income | **Credit** | Money you earned from doing the work / selling. |
| Forfeited Deposit Income | Income | **Credit** | A kept non-refundable deposit when a deal dies — you earned it as a cancellation fee. |
| Sales Discounts | Income (contra) | **Debit** ⚠️ | The "backwards" one — an income account that lives on the debit side because its job is to *reduce* income. |
| Operating Expenses | Expense | **Debit** | Money you spend to run the business (rent, software, supplies). |
| Bad Debt Expense | Expense | **Debit** | Money a customer owed that you've given up collecting — booked as a loss. |

> Note on the "backwards" one (Sales Discounts): it's flagged because it's the single exception
> that *proves* the rule. Don't over-explain it up front — let the learner meet it last, after the
> main rule is solid, as the "aha, I actually get this now" moment.

---

## Who PARTNERS with whom (the pairing model — great for a matching game)

These are the common, correct pairings — "when this account moves, which account usually moves
with it?" Use these for a drag-to-match / connect-the-pair interaction.

| Account | Commonly partners with | The story |
|---|---|---|
| Cash ↔ Sales Revenue | A cash sale — money in, income up. |
| Cash ↔ Accounts Receivable | A customer pays an invoice — what they owed turns into cash. |
| Accounts Receivable ↔ Sales Revenue | You send an invoice — you earned it and they now owe you. |
| Cash ↔ Customer Deposits | A deposit comes in — cash up, and you owe the work. |
| Customer Deposits ↔ Sales Revenue | The work gets done — the held deposit becomes earned income. |
| Customer Deposits ↔ Forfeited Deposit Income | Deal dies, deposit kept — the held deposit becomes a cancellation fee (income). |
| Cash ↔ Deferred Revenue | Prepaid for a multi-month job — cash up, owe the work over time. |
| Deferred Revenue ↔ Sales Revenue | Each month of work earns a slice of the prepaid amount. |
| Operating Expenses ↔ Cash | You pay a bill — expense up, cash down. |
| Operating Expenses ↔ Accounts Payable | A bill you owe but haven't paid — expense up, you owe a vendor. |
| Accounts Payable ↔ Cash | You pay that vendor bill — what you owed turns into cash out. |
| Bad Debt Expense ↔ Accounts Receivable | A customer won't pay — wipe the receivable, book the loss. |
| Sales Discounts ↔ Accounts Receivable | You lower a price after sending — income reduced, less owed. |
| Owner's Equity ↔ Cash | The owner puts money into the business — cash up, equity up. |

---

## Who NEVER partners (the "these don't pair" set — for the match game's wrong answers)

These pairings should **fail** if the learner tries to match them — they don't make a sensible
single transaction. Good "nope, try again" cases:

- **Sales Revenue ↔ Bad Debt Expense** — earning and writing off aren't one event.
- **Owner's Equity ↔ Operating Expenses** — putting money in isn't a daily expense.
- **Forfeited Deposit Income ↔ Cash (directly)** — a forfeit moves the *deposit liability* to income; no cash moves at that moment (you already had the cash).
- **Customer Deposits ↔ Accounts Payable** — one is money customers gave you, the other is money you owe vendors; unrelated.
- **Sales Revenue ↔ Operating Expenses** — income and spending are different sides of the story; they don't directly offset in one entry.
- **Bad Debt Expense ↔ Cash** — writing off a bad debt is a non-cash loss; no money moves.

---

## Suggested interactions (build whichever are feasible — interactive beats text)

1. **Home-side sort:** drag each account into Debit-home or Credit-home; snap on correct, bounce + hint on wrong.
2. **Up or down:** pick an account, choose "debit" or "credit," watch a little balance bar go up/down so the learner *sees* the direction.
3. **Match the pair:** draw a line between two accounts that belong in the same transaction. Correct pairs (table above) connect with a green link + the one-line story; the "never" pairs reject with a gentle nudge.
4. **Build an entry:** pick a real event ("send an invoice," "take a deposit," "client cancels — keep the deposit") and the learner places the two accounts + picks debit/credit; the tool confirms when it balances.

Keep copy minimal on screen — one line per account, the story revealed on interaction, not walls
of text. The learner said explicitly: she wants to *play with it until it clicks*, not read.

---

## Data shape (so the agent can drive the UI from one source)

The existing engine already defines these accounts (`src/lib/accounting/engine.ts`, the `ACCOUNTS`
array — Cash, AR, Customer Deposits, Deferred Revenue, Owner's Equity, Sales Revenue, Forfeited
Deposit Income, Sales Discounts, Operating Expenses, Bad Debt Expense). Reuse that array as the
source of truth; this lesson layer adds, per account: a one-line meaning, its partner list, and its
"never" list. Add **Accounts Payable** to round out the "what I owe" side for the lesson (it's in
the partner tables above).
