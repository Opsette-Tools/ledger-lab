// Guided lessons — the teaching content of Ledger Lab.
//
// Each lesson follows the same shape (see docs/LESSON_SCRIPTS.md):
//   1. intro     — the question, shown before the user clicks anything
//   2. steps[]   — each carries the button label AND the plain-English
//                  narration shown the instant that step runs
//   3. takeaway  — the one-sentence lesson, shown when the lesson completes
//
// The spine: cash & accrual only diverge when money and delivery happen at
// different times. Each lesson steps one notch further from "paid-and-delivered
// -at-once," which is where the two methods start to disagree.

import * as A from "./actions";
import type { LedgerSnapshot } from "./actions";
import type { Mode } from "./engine";

export type StepResult = A.ActionResult;

export interface LessonStep {
  /** Button label for single-stepping this beat (the named real-world action). */
  label: string;
  /** Must call an action helper; reads the current mode from the snapshot.
   *  The narration shown after a step is the engine's own mode-correct
   *  explanation (result.explanation) — NOT a hardcoded string here — so the
   *  text always matches the method the user actually ran it in. */
  apply: (snap: LedgerSnapshot) => StepResult;
}

/**
 * The lesson's takeaway, split by method so the UI can lead with whichever one
 * the user is actually in (cash first when they're in cash, etc.) and frame the
 * OTHER as the contrast — instead of always hardcoding "in accrual… in cash
 * it's the opposite," which reads backwards when you're standing on the cash tab.
 */
export interface Takeaway {
  /** What this event does under the cash method. */
  cash: string;
  /** What this event does under the accrual method. */
  accrual: string;
  /** Optional shared lesson that's true regardless of method — shown after the
   *  method-specific halves. */
  shared?: string;
}

export interface Lesson {
  id: string;
  /** Short label for the lesson picker. */
  shortLabel: string;
  /** Full lesson title. */
  title: string;
  /** The question/setup, shown before any step runs. */
  intro: string;
  /** The takeaway, split by method (see Takeaway). */
  takeaway: Takeaway;
  /** Optional: the method this lesson is most illuminating in (tip only —
   *  never auto-switched; the user owns the toggle). */
  suggestedMode?: Mode;
  steps: LessonStep[];
}

const ACME = "Acme Co.";
const BETA = "Beta LLC";

export const LESSONS: Lesson[] = [
  {
    id: "cash-sale",
    shortLabel: "Cash sale",
    title: "Lesson 1 — Does it matter how you count a cash sale?",
    intro:
      "A customer walks in, pays $200 in cash, and leaves with what they bought. Simple. But “cash” and “accrual” are two ways of keeping books — let's see if this simple sale looks different in each one. Ring it up and watch the explanation appear.",
    takeaway: {
      cash: "You counted $200 of revenue the moment the cash arrived.",
      accrual: "You counted $200 of revenue the moment you earned it — which was the same moment, since they paid and took the goods at once.",
      shared:
        "So both methods agree here: when a customer pays AND gets the thing at the same time, it doesn't matter which one you use. The two only diverge when money and the work happen at different times — that's the next lesson.",
    },
    suggestedMode: "cash",
    steps: [
      {
        label: "Ring up the $200 sale",
        apply: (s) => A.recordCashSale(s, { amount: 200, customer: "Walk-in" }),
      },
    ],
  },
  {
    id: "invoice",
    shortLabel: "Invoice",
    title: "Lesson 2 — What happens when you bill someone and wait to get paid?",
    intro:
      "Last time, money and the goods changed hands at the same instant. Now they don't: you send a customer a bill (an invoice) today, and they'll pay you in a few weeks. This is where cash and accrual stop agreeing — send the bill and watch.",
    takeaway: {
      cash: "Cash ignores the bill entirely — nothing counts until the money actually lands. The sale shows up the day you get paid, not the day you did the work.",
      accrual: "Accrual counts the sale when you do the work and send the bill, not when you get paid. The money you're owed waits in “Accounts Receivable” until it arrives.",
    },
    suggestedMode: "accrual",
    steps: [
      {
        label: "Send Acme a $500 invoice",
        apply: (s) => A.sendInvoice(s, { amount: 500, customer: ACME }),
      },
      {
        label: "Acme pays the $500",
        apply: (s) => {
          const inv = s.invoices.find((i) => i.customer === ACME && i.status === "sent");
          if (!inv) throw new Error("Invoice not found");
          return A.recordPayment(s, { invoiceId: inv.id, amount: 500 });
        },
      },
    ],
  },
  {
    id: "deposit",
    shortLabel: "Deposit",
    title: "Lesson 3 — What if they pay you BEFORE you've done the work?",
    intro:
      "Flip it around. A customer hands you a $300 deposit up front to hold their spot — but you haven't done anything yet. Did you just “earn” $300? Run it and find out.",
    takeaway: {
      cash: "Cash counts the $300 as revenue the moment it arrives — it doesn't care that you haven't done the work yet.",
      accrual: "Accrual won't call it revenue yet — getting paid early isn't the same as earning it. It holds the $300 as a kind of debt (“Customer Deposits”) until you deliver, then turns it into revenue.",
      shared:
        "This is the exact mirror of Lesson 2: there you earned it before the cash came; here the cash came before you earned it.",
    },
    suggestedMode: "accrual",
    steps: [
      {
        label: "Take a $300 deposit from Beta",
        apply: (s) => A.takeDeposit(s, { amount: 300, customer: BETA }),
      },
      {
        label: "Do the work",
        apply: (s) => {
          const dep = s.deposits.find((d) => d.customer === BETA && d.status === "held");
          if (!dep) throw new Error("Deposit not found");
          return A.completeWork(s, { depositId: dep.id });
        },
      },
    ],
  },
  {
    id: "forfeit",
    shortLabel: "Forfeit",
    title: "Lesson 4 — They paid a deposit… then cancelled. Now what?",
    intro:
      "This is the messy one that trips people up. Beta gives you a $300 non-refundable deposit and you bill them $1,000 for the full job — then they walk away. You keep the deposit, but you'll never collect the rest. Step through it and watch how the books clean this up.",
    takeaway: {
      cash: "Cash never had this mess — it never counted the $1,000 in the first place, so there's nothing to undo. It just keeps the $300 it actually received.",
      accrual: "Accrual has to clean up after itself: undo the revenue it counted but won't collect (the $700 “write-off”) and recognize the money it gets to keep (the $300 forfeit becomes income).",
    },
    suggestedMode: "accrual",
    steps: [
      {
        label: "Bill Beta the full $1,000",
        apply: (s) => A.sendInvoice(s, { amount: 1000, customer: BETA }),
      },
      {
        label: "Take a $300 non-refundable deposit",
        apply: (s) => A.takeDeposit(s, { amount: 300, customer: BETA }),
      },
      {
        label: "They cancel — you keep the deposit",
        apply: (s) => {
          const dep = s.deposits.find((d) => d.customer === BETA && d.status === "held");
          if (!dep) throw new Error("Deposit not found");
          return A.forfeitDeposit(s, { depositId: dep.id });
        },
      },
      {
        label: "Write off the $700 you'll never collect",
        apply: (s) => {
          const inv = s.invoices.find((i) => i.customer === BETA);
          if (!inv) throw new Error("Invoice not found");
          return A.writeOffBadDebt(s, { invoiceId: inv.id });
        },
      },
    ],
  },
  {
    id: "prepaid",
    shortLabel: "Prepaid ★",
    title: "Lesson 5 — The big one: $6,000 up front for 6 months of work",
    intro:
      "A client pays you $6,000 today for a 6-month contract. Same $6,000 either way — but cash and accrual tell wildly different stories about your business. Run it once in each method and compare the shape of the revenue chart.",
    takeaway: {
      cash: "Cash dumps all $6,000 into the month the money arrived — one giant spike, then five dead months. Your books just follow your bank account.",
      accrual: "Accrual spreads it across the six months you actually do the work — a steady, honest $1,000/month. Your books reflect reality, not just cash timing.",
      shared:
        "Same $6,000, same business — wildly different pictures. This is the clearest reason the method matters.",
    },
    steps: [
      {
        label: "Receive the $6,000 prepayment",
        apply: (s) =>
          A.receivePrepaidContract(s, {
            amount: 6000,
            customer: "Yearly Client",
            months: 6,
            date: monthDate(0),
          }),
      },
      ...[1, 2, 3, 4, 5, 6].map((m) => ({
        label: `Month ${m}: deliver, recognize $1,000`,
        apply: (s: LedgerSnapshot) =>
          A.recognizeDeferred(s, {
            amount: 1000,
            monthLabel: `Month ${m}`,
            date: monthDate(m - 1),
          }),
      })),
    ],
  },
];

function monthDate(offsetMonths: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  d.setDate(15);
  return d.toISOString();
}
