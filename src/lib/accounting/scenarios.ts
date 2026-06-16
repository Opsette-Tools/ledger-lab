// Preset guided scenarios. Each step is applied through the action helpers.

import * as A from "./actions";
import type { LedgerSnapshot } from "./actions";
import type { Mode } from "./engine";

export type StepResult = A.ActionResult;
export type Step = {
  label: string;
  /** Must call one of the action helpers; mode is read from snapshot. */
  apply: (snap: LedgerSnapshot) => StepResult;
};

export interface Scenario {
  id: string;
  title: string;
  blurb: string;
  /** If set, the scenario only makes sense in this mode (we'll auto-switch). */
  forceMode?: Mode;
  steps: Step[];
}

const ACME = "Acme Co.";
const BETA = "Beta LLC";

export const SCENARIOS: Scenario[] = [
  {
    id: "cash-sale",
    title: "(a) Simple cash sale",
    blurb: "Customer walks in, pays, leaves. The cleanest case.",
    forceMode: "cash",
    steps: [
      {
        label: "Take $200 cash sale",
        apply: (s) => A.takeDeposit(s, { amount: 200, customer: "Walk-in" }),
      },
    ],
  },
  {
    id: "accrual-invoice",
    title: "(b) Accrual invoice paid in full",
    blurb: "Send invoice → revenue recorded now → cash arrives later.",
    forceMode: "accrual",
    steps: [
      {
        label: "Send $500 invoice to Acme",
        apply: (s) => A.sendInvoice(s, { amount: 500, customer: ACME }),
      },
      {
        label: "Acme pays in full",
        apply: (s) => {
          const inv = s.invoices.find((i) => i.customer === ACME && i.status === "sent");
          if (!inv) throw new Error("Invoice not found");
          return A.recordPayment(s, { invoiceId: inv.id, amount: 500 });
        },
      },
    ],
  },
  {
    id: "deposit-complete-balance",
    title: "(c) Deposit → complete → balance (accrual)",
    blurb: "Take a deposit, do the work, collect the rest.",
    forceMode: "accrual",
    steps: [
      {
        label: "Send $1,000 invoice to Beta",
        apply: (s) => A.sendInvoice(s, { amount: 1000, customer: BETA }),
      },
      {
        label: "Take $300 deposit",
        apply: (s) => A.takeDeposit(s, { amount: 300, customer: BETA }),
      },
      {
        label: "Complete the work",
        apply: (s) => {
          const dep = s.deposits.find((d) => d.customer === BETA && d.status === "held");
          if (!dep) throw new Error("Deposit not found");
          return A.completeWork(s, { depositId: dep.id });
        },
      },
      {
        label: "Beta pays the remaining $700",
        apply: (s) => {
          const inv = s.invoices.find((i) => i.customer === BETA);
          if (!inv) throw new Error("Invoice not found");
          return A.recordPayment(s, { invoiceId: inv.id, amount: 700 });
        },
      },
    ],
  },
  {
    id: "deposit-cancel-forfeit",
    title: "(d) Deposit → cancel → forfeit + write-off",
    blurb:
      "The story that usually breaks tools. Ends: Cash $300, Forfeited Income $300, AR $0.",
    forceMode: "accrual",
    steps: [
      {
        label: "Send $1,000 invoice to Beta",
        apply: (s) => A.sendInvoice(s, { amount: 1000, customer: BETA }),
      },
      {
        label: "Take $300 non-refundable deposit",
        apply: (s) => A.takeDeposit(s, { amount: 300, customer: BETA }),
      },
      {
        label: "Client cancels — forfeit the deposit",
        apply: (s) => {
          const dep = s.deposits.find((d) => d.customer === BETA && d.status === "held");
          if (!dep) throw new Error("Deposit not found");
          return A.forfeitDeposit(s, { depositId: dep.id });
        },
      },
      {
        label: "Write off the remaining $700 of the invoice",
        apply: (s) => {
          const inv = s.invoices.find((i) => i.customer === BETA);
          if (!inv) throw new Error("Invoice not found");
          return A.writeOffBadDebt(s, { invoiceId: inv.id });
        },
      },
    ],
  },
  {
    id: "prepaid-contract",
    title: "(e) Prepaid 6-month contract — the headline lesson",
    blurb:
      "$6,000 upfront for 6 months. Cash: one giant spike. Accrual: smooth $1,000/mo. Same money, totally different story.",
    steps: [
      {
        label: "Receive $6,000 prepayment for a 6-month contract",
        apply: (s) =>
          A.receivePrepaidContract(s, {
            amount: 6000,
            customer: "Yearly Client",
            months: 6,
            date: monthDate(0),
          }),
      },
      ...[1, 2, 3, 4, 5, 6].map((m) => ({
        label: `Month ${m}: recognize $1,000 earned`,
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
