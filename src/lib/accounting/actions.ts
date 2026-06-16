// Action handlers — encode the cash-vs-accrual divergence in one place.
// Each handler returns { entry, domainPatch, explanation }.

import {
  buildEntry,
  type Deposit,
  type Invoice,
  type JournalEntry,
  type Mode,
  type Payment,
} from "./engine";

export interface LedgerSnapshot {
  mode: Mode;
  entries: JournalEntry[];
  invoices: Invoice[];
  deposits: Deposit[];
  payments: Payment[];
}

export interface ActionResult {
  newEntries: JournalEntry[];
  invoices: Invoice[];
  deposits: Deposit[];
  payments: Payment[];
  explanation: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const newId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

const FORWARD_DATE = (date?: string) => date ?? new Date().toISOString();

// ---------- Forward actions ----------

export function sendInvoice(
  s: LedgerSnapshot,
  args: { amount: number; customer: string; date?: string },
): ActionResult {
  const id = newId("inv");
  const invoice: Invoice = {
    id,
    customer: args.customer,
    amount: round2(args.amount),
    paidAmount: 0,
    discountAmount: 0,
    creditedAmount: 0,
    status: "sent",
    modeWhenSent: s.mode,
  };
  const date = FORWARD_DATE(args.date);

  if (s.mode === "accrual") {
    const entry = buildEntry({
      mode: s.mode,
      description: `Invoice sent to ${args.customer} — $${invoice.amount}`,
      plainEnglish: `You sent a $${invoice.amount} invoice to ${args.customer}. In Accrual mode the sale counts now (it's earned), so we recorded the revenue and an Account Receivable for what they owe you. No cash has moved yet.`,
      lines: [
        { accountCode: "1100", debit: invoice.amount },
        { accountCode: "4000", credit: invoice.amount },
      ],
      sourceRef: id,
      date,
    });
    return {
      newEntries: [entry],
      invoices: [...s.invoices, invoice],
      deposits: s.deposits,
      payments: s.payments,
      explanation: entry.plainEnglish,
    };
  }
  // Cash: no posting; informational log
  const info = buildEntry({
    mode: s.mode,
    description: `Invoice sent to ${args.customer} — $${invoice.amount} (no posting in Cash mode)`,
    plainEnglish: `You sent a $${invoice.amount} invoice. In Cash mode nothing posts yet — money hasn't moved. The invoice is on file and will record revenue when payment arrives.`,
    lines: [],
    sourceRef: id,
    informational: true,
    date,
  });
  return {
    newEntries: [info],
    invoices: [...s.invoices, invoice],
    deposits: s.deposits,
    payments: s.payments,
    explanation: info.plainEnglish,
  };
}

export function recordPayment(
  s: LedgerSnapshot,
  args: { invoiceId: string; amount: number; date?: string },
): ActionResult {
  const invoice = s.invoices.find((i) => i.id === args.invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const remaining = round2(invoice.amount - invoice.paidAmount - invoice.creditedAmount - invoice.discountAmount);
  const amt = round2(Math.min(args.amount, remaining));
  if (amt <= 0) throw new Error("Nothing left to pay on this invoice");

  const pay: Payment = {
    id: newId("pay"),
    invoiceId: invoice.id,
    amount: amt,
    refundedAmount: 0,
    mode: s.mode,
  };
  const newPaid = round2(invoice.paidAmount + amt);
  const fullyPaid = newPaid + invoice.creditedAmount + invoice.discountAmount >= invoice.amount;
  const updated: Invoice = {
    ...invoice,
    paidAmount: newPaid,
    status: fullyPaid ? "paid" : "partially_paid",
  };
  const date = FORWARD_DATE(args.date);

  let entry: JournalEntry;
  if (s.mode === "cash" || invoice.modeWhenSent !== "accrual") {
    entry = buildEntry({
      mode: s.mode,
      description: `Payment from ${invoice.customer} — $${amt}`,
      plainEnglish: `${invoice.customer} paid $${amt}. In Cash mode revenue is recorded right now — when the money actually arrived.`,
      lines: [
        { accountCode: "1000", debit: amt },
        { accountCode: "4000", credit: amt },
      ],
      sourceRef: pay.id,
      date,
    });
  } else {
    entry = buildEntry({
      mode: s.mode,
      description: `Payment from ${invoice.customer} — $${amt}`,
      plainEnglish: `${invoice.customer} paid $${amt}. Revenue was already counted when you sent the invoice, so this just turns the receivable into cash — Accounts Receivable goes down, Cash goes up.`,
      lines: [
        { accountCode: "1000", debit: amt },
        { accountCode: "1100", credit: amt },
      ],
      sourceRef: pay.id,
      date,
    });
  }

  return {
    newEntries: [entry],
    invoices: s.invoices.map((i) => (i.id === invoice.id ? updated : i)),
    deposits: s.deposits,
    payments: [...s.payments, pay],
    explanation: entry.plainEnglish,
  };
}

export function takeDeposit(
  s: LedgerSnapshot,
  args: { amount: number; customer: string; date?: string },
): ActionResult {
  const dep: Deposit = {
    id: newId("dep"),
    customer: args.customer,
    amount: round2(args.amount),
    status: "held",
    modeWhenTaken: s.mode,
  };
  const date = FORWARD_DATE(args.date);
  let entry: JournalEntry;
  if (s.mode === "cash") {
    entry = buildEntry({
      mode: s.mode,
      description: `Deposit from ${args.customer} — $${dep.amount}`,
      plainEnglish: `You collected a $${dep.amount} deposit from ${args.customer}. In Cash mode that hits revenue immediately — money moved, so it counts.`,
      lines: [
        { accountCode: "1000", debit: dep.amount },
        { accountCode: "4000", credit: dep.amount },
      ],
      sourceRef: dep.id,
      date,
    });
  } else {
    entry = buildEntry({
      mode: s.mode,
      description: `Deposit from ${args.customer} — $${dep.amount}`,
      plainEnglish: `You collected a $${dep.amount} deposit. In Accrual mode you haven't earned it yet — you owe the work. We hold it as a liability (Customer Deposits) until the job is done.`,
      lines: [
        { accountCode: "1000", debit: dep.amount },
        { accountCode: "2050", credit: dep.amount },
      ],
      sourceRef: dep.id,
      date,
    });
  }
  return {
    newEntries: [entry],
    invoices: s.invoices,
    deposits: [...s.deposits, dep],
    payments: s.payments,
    explanation: entry.plainEnglish,
  };
}

export function completeWork(
  s: LedgerSnapshot,
  args: { depositId: string; date?: string },
): ActionResult {
  const dep = s.deposits.find((d) => d.id === args.depositId);
  if (!dep) throw new Error("Deposit not found");
  if (dep.status !== "held") throw new Error("Deposit isn't held");
  const date = FORWARD_DATE(args.date);

  if (dep.modeWhenTaken === "accrual") {
    const entry = buildEntry({
      mode: s.mode,
      description: `Work completed for ${dep.customer} — earn $${dep.amount}`,
      plainEnglish: `The job for ${dep.customer} is done. The $${dep.amount} you were holding as a liability is now earned — it drains out of Customer Deposits and into Sales Revenue.`,
      lines: [
        { accountCode: "2050", debit: dep.amount },
        { accountCode: "4000", credit: dep.amount },
      ],
      sourceRef: dep.id,
      date,
    });
    return {
      newEntries: [entry],
      invoices: s.invoices,
      deposits: s.deposits.map((d) => (d.id === dep.id ? { ...d, status: "completed" } : d)),
      payments: s.payments,
      explanation: entry.plainEnglish,
    };
  }
  const info = buildEntry({
    mode: s.mode,
    description: `Work completed for ${dep.customer} (no posting — deposit was Cash-mode income)`,
    plainEnglish: `Job done. Nothing posts: in Cash mode the deposit was already booked as revenue when the money arrived.`,
    lines: [],
    informational: true,
    sourceRef: dep.id,
    date,
  });
  return {
    newEntries: [info],
    invoices: s.invoices,
    deposits: s.deposits.map((d) => (d.id === dep.id ? { ...d, status: "completed" } : d)),
    payments: s.payments,
    explanation: info.plainEnglish,
  };
}

export function recordExpense(
  s: LedgerSnapshot,
  args: { amount: number; category: string; date?: string },
): ActionResult {
  const amt = round2(args.amount);
  const date = FORWARD_DATE(args.date);
  const entry = buildEntry({
    mode: s.mode,
    description: `Expense — ${args.category} $${amt}`,
    plainEnglish: `You paid $${amt} for ${args.category}. Money left the bank, expenses went up — profit drops by that amount.`,
    lines: [
      { accountCode: "5000", debit: amt },
      { accountCode: "1000", credit: amt },
    ],
    date,
  });
  return {
    newEntries: [entry],
    invoices: s.invoices,
    deposits: s.deposits,
    payments: s.payments,
    explanation: entry.plainEnglish,
  };
}

// ---------- Reverse actions ----------

export function cancelUnpaidInvoice(
  s: LedgerSnapshot,
  args: { invoiceId: string; date?: string },
): ActionResult {
  const invoice = s.invoices.find((i) => i.id === args.invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.paidAmount > 0) throw new Error("This invoice has payments — use Refund instead.");
  const date = FORWARD_DATE(args.date);

  if (invoice.modeWhenSent === "accrual") {
    const remaining = round2(invoice.amount - invoice.creditedAmount - invoice.discountAmount);
    if (remaining > 0) {
      const entry = buildEntry({
        mode: s.mode,
        description: `Cancel invoice ${invoice.id.slice(0, 8)} — back out $${remaining}`,
        plainEnglish: `Cancelling an unpaid Accrual invoice. We reverse what we booked when it was sent: Sales Revenue goes down and Accounts Receivable goes down by $${remaining}. The sale isn't happening.`,
        lines: [
          { accountCode: "4000", debit: remaining },
          { accountCode: "1100", credit: remaining },
        ],
        sourceRef: invoice.id,
        date,
      });
      return {
        newEntries: [entry],
        invoices: s.invoices.map((i) =>
          i.id === invoice.id ? { ...i, status: "cancelled" } : i,
        ),
        deposits: s.deposits,
        payments: s.payments,
        explanation: entry.plainEnglish,
      };
    }
  }
  const info = buildEntry({
    mode: s.mode,
    description: `Cancel invoice ${invoice.id.slice(0, 8)} — nothing to reverse`,
    plainEnglish: `Invoice cancelled. Nothing posts — it was either Cash-mode (never recorded) or had no remaining balance.`,
    lines: [],
    informational: true,
    sourceRef: invoice.id,
    date,
  });
  return {
    newEntries: [info],
    invoices: s.invoices.map((i) => (i.id === invoice.id ? { ...i, status: "cancelled" } : i)),
    deposits: s.deposits,
    payments: s.payments,
    explanation: info.plainEnglish,
  };
}

export function issueCreditMemo(
  s: LedgerSnapshot,
  args: { invoiceId: string; amount: number; date?: string },
): ActionResult {
  const invoice = s.invoices.find((i) => i.id === args.invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const amt = round2(args.amount);
  const date = FORWARD_DATE(args.date);
  const updated: Invoice = {
    ...invoice,
    creditedAmount: round2(invoice.creditedAmount + amt),
  };
  if (invoice.modeWhenSent === "accrual") {
    const entry = buildEntry({
      mode: s.mode,
      description: `Credit memo against invoice ${invoice.id.slice(0, 8)} — $${amt}`,
      plainEnglish: `You issued a $${amt} credit memo. The original invoice stays on record (audit trail), but a separate entry knocks $${amt} off Sales Revenue and $${amt} off Accounts Receivable.`,
      lines: [
        { accountCode: "4000", debit: amt },
        { accountCode: "1100", credit: amt },
      ],
      sourceRef: invoice.id,
      date,
    });
    return {
      newEntries: [entry],
      invoices: s.invoices.map((i) => (i.id === invoice.id ? updated : i)),
      deposits: s.deposits,
      payments: s.payments,
      explanation: entry.plainEnglish,
    };
  }
  const info = buildEntry({
    mode: s.mode,
    description: `Credit memo $${amt} (Cash mode — informational)`,
    plainEnglish: `Credit memo recorded for $${amt}. In Cash mode nothing posts unless you also refund cash.`,
    lines: [],
    informational: true,
    sourceRef: invoice.id,
    date,
  });
  return {
    newEntries: [info],
    invoices: s.invoices.map((i) => (i.id === invoice.id ? updated : i)),
    deposits: s.deposits,
    payments: s.payments,
    explanation: info.plainEnglish,
  };
}

export function refundPayment(
  s: LedgerSnapshot,
  args: { paymentId: string; amount: number; date?: string },
): ActionResult {
  const pay = s.payments.find((p) => p.id === args.paymentId);
  if (!pay) throw new Error("Payment not found");
  const remaining = round2(pay.amount - pay.refundedAmount);
  const amt = round2(Math.min(args.amount, remaining));
  if (amt <= 0) throw new Error("Nothing left to refund on this payment");
  const date = FORWARD_DATE(args.date);

  const entry = buildEntry({
    mode: s.mode,
    description: `Refund payment ${pay.id.slice(0, 8)} — $${amt}`,
    plainEnglish: `You refunded $${amt}. This is the mirror of the original payment — Sales Revenue comes back down and Cash leaves the bank.`,
    lines: [
      { accountCode: "4000", debit: amt },
      { accountCode: "1000", credit: amt },
    ],
    sourceRef: pay.id,
    date,
  });
  return {
    newEntries: [entry],
    invoices: s.invoices,
    deposits: s.deposits,
    payments: s.payments.map((p) =>
      p.id === pay.id ? { ...p, refundedAmount: round2(p.refundedAmount + amt) } : p,
    ),
    explanation: entry.plainEnglish,
  };
}

export function forfeitDeposit(
  s: LedgerSnapshot,
  args: { depositId: string; date?: string },
): ActionResult {
  const dep = s.deposits.find((d) => d.id === args.depositId);
  if (!dep) throw new Error("Deposit not found");
  if (dep.status !== "held") throw new Error("Deposit isn't held");
  const date = FORWARD_DATE(args.date);

  if (dep.modeWhenTaken === "accrual") {
    const entry = buildEntry({
      mode: s.mode,
      description: `Forfeit deposit from ${dep.customer} — $${dep.amount}`,
      plainEnglish: `The deal died and you keep the deposit. The $${dep.amount} liability turns into Forfeited Deposit Income — you've earned it as a cancellation fee.`,
      lines: [
        { accountCode: "2050", debit: dep.amount },
        { accountCode: "4100", credit: dep.amount },
      ],
      sourceRef: dep.id,
      date,
    });
    return {
      newEntries: [entry],
      invoices: s.invoices,
      deposits: s.deposits.map((d) =>
        d.id === dep.id ? { ...d, status: "forfeited" } : d,
      ),
      payments: s.payments,
      explanation: entry.plainEnglish,
    };
  }
  const info = buildEntry({
    mode: s.mode,
    description: `Forfeit deposit (Cash mode — already income)`,
    plainEnglish: `In Cash mode the deposit was already revenue when it arrived. We just mark it forfeited — no journal change needed.`,
    lines: [],
    informational: true,
    sourceRef: dep.id,
    date,
  });
  return {
    newEntries: [info],
    invoices: s.invoices,
    deposits: s.deposits.map((d) => (d.id === dep.id ? { ...d, status: "forfeited" } : d)),
    payments: s.payments,
    explanation: info.plainEnglish,
  };
}

export function writeOffBadDebt(
  s: LedgerSnapshot,
  args: { invoiceId: string; date?: string },
): ActionResult {
  const invoice = s.invoices.find((i) => i.id === args.invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const date = FORWARD_DATE(args.date);
  const remaining = round2(
    invoice.amount - invoice.paidAmount - invoice.creditedAmount - invoice.discountAmount,
  );
  if (invoice.modeWhenSent === "accrual" && remaining > 0) {
    const entry = buildEntry({
      mode: s.mode,
      description: `Write off invoice ${invoice.id.slice(0, 8)} — $${remaining}`,
      plainEnglish: `Writing off $${remaining} that ${invoice.customer} will never pay. Bad Debt Expense goes up (you book the loss), and Accounts Receivable goes down (remove what they owed).`,
      lines: [
        { accountCode: "5500", debit: remaining },
        { accountCode: "1100", credit: remaining },
      ],
      sourceRef: invoice.id,
      date,
    });
    return {
      newEntries: [entry],
      invoices: s.invoices.map((i) =>
        i.id === invoice.id ? { ...i, status: "written_off" } : i,
      ),
      deposits: s.deposits,
      payments: s.payments,
      explanation: entry.plainEnglish,
    };
  }
  const info = buildEntry({
    mode: s.mode,
    description: `Write off invoice — nothing to remove`,
    plainEnglish: `In Cash mode there's nothing to write off — you never counted uncollected income. Marked closed.`,
    lines: [],
    informational: true,
    sourceRef: invoice.id,
    date,
  });
  return {
    newEntries: [info],
    invoices: s.invoices.map((i) => (i.id === invoice.id ? { ...i, status: "written_off" } : i)),
    deposits: s.deposits,
    payments: s.payments,
    explanation: info.plainEnglish,
  };
}

export function applyDiscount(
  s: LedgerSnapshot,
  args: { invoiceId: string; amount: number; date?: string },
): ActionResult {
  const invoice = s.invoices.find((i) => i.id === args.invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const amt = round2(args.amount);
  const date = FORWARD_DATE(args.date);
  const updated: Invoice = {
    ...invoice,
    discountAmount: round2(invoice.discountAmount + amt),
  };
  if (invoice.modeWhenSent === "accrual") {
    const entry = buildEntry({
      mode: s.mode,
      description: `Discount $${amt} on invoice ${invoice.id.slice(0, 8)}`,
      plainEnglish: `Applied a $${amt} discount after sending. Sales Discounts (a contra-revenue) goes up by $${amt}, and Accounts Receivable goes down by $${amt}. Net revenue falls by that amount.`,
      lines: [
        { accountCode: "4900", debit: amt },
        { accountCode: "1100", credit: amt },
      ],
      sourceRef: invoice.id,
      date,
    });
    return {
      newEntries: [entry],
      invoices: s.invoices.map((i) => (i.id === invoice.id ? updated : i)),
      deposits: s.deposits,
      payments: s.payments,
      explanation: entry.plainEnglish,
    };
  }
  const info = buildEntry({
    mode: s.mode,
    description: `Discount $${amt} (Cash mode — informational)`,
    plainEnglish: `Discount noted. In Cash mode this just means you'll collect $${amt} less — revenue adjusts when the (smaller) payment arrives.`,
    lines: [],
    informational: true,
    sourceRef: invoice.id,
    date,
  });
  return {
    newEntries: [info],
    invoices: s.invoices.map((i) => (i.id === invoice.id ? updated : i)),
    deposits: s.deposits,
    payments: s.payments,
    explanation: info.plainEnglish,
  };
}

export function voidInvoice(
  s: LedgerSnapshot,
  args: { invoiceId: string; date?: string },
): ActionResult {
  const invoice = s.invoices.find((i) => i.id === args.invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.paidAmount > 0) {
    throw new Error(
      "This invoice has collected money — use Refund or Forfeit instead, not Void.",
    );
  }
  // Same effect as cancel for an unpaid invoice
  return cancelUnpaidInvoice(s, { invoiceId: args.invoiceId, date: args.date });
}

// ---------- Prepaid contract (scenario e) ----------

export function receivePrepaidContract(
  s: LedgerSnapshot,
  args: { amount: number; customer: string; months: number; date?: string },
): ActionResult {
  const amt = round2(args.amount);
  const date = FORWARD_DATE(args.date);
  if (s.mode === "cash") {
    const entry = buildEntry({
      mode: s.mode,
      description: `Prepaid contract from ${args.customer} — $${amt}`,
      plainEnglish: `${args.customer} paid $${amt} upfront for a ${args.months}-month contract. In Cash mode the entire $${amt} hits revenue right now — this month looks huge and the next ${args.months - 1} months will look dead. That timing distortion is the whole point of the lesson.`,
      lines: [
        { accountCode: "1000", debit: amt },
        { accountCode: "4000", credit: amt },
      ],
      date,
    });
    return {
      newEntries: [entry],
      invoices: s.invoices,
      deposits: s.deposits,
      payments: s.payments,
      explanation: entry.plainEnglish,
    };
  }
  const entry = buildEntry({
    mode: s.mode,
    description: `Prepaid contract from ${args.customer} — $${amt}`,
    plainEnglish: `${args.customer} paid $${amt} upfront for a ${args.months}-month contract. In Accrual mode we haven't earned it yet — it sits in Deferred Revenue (a liability: paid but not earned). Each month we'll move $${round2(amt / args.months)} into Sales Revenue.`,
    lines: [
      { accountCode: "1000", debit: amt },
      { accountCode: "2100", credit: amt },
    ],
    date,
  });
  return {
    newEntries: [entry],
    invoices: s.invoices,
    deposits: s.deposits,
    payments: s.payments,
    explanation: entry.plainEnglish,
  };
}

export function recognizeDeferred(
  s: LedgerSnapshot,
  args: { amount: number; monthLabel: string; date?: string },
): ActionResult {
  const amt = round2(args.amount);
  const date = FORWARD_DATE(args.date);
  if (s.mode !== "accrual") {
    const info = buildEntry({
      mode: s.mode,
      description: `Recognize deferred revenue (no-op in Cash mode)`,
      plainEnglish: `Nothing to recognize — Cash mode booked the full amount upfront.`,
      lines: [],
      informational: true,
      date,
    });
    return {
      newEntries: [info],
      invoices: s.invoices,
      deposits: s.deposits,
      payments: s.payments,
      explanation: info.plainEnglish,
    };
  }
  const entry = buildEntry({
    mode: s.mode,
    description: `Recognize $${amt} of deferred revenue — ${args.monthLabel}`,
    plainEnglish: `Another month of the contract is delivered. $${amt} moves from Deferred Revenue (liability) into Sales Revenue (income). Smooth $${amt}/month — not a one-time spike.`,
    lines: [
      { accountCode: "2100", debit: amt },
      { accountCode: "4000", credit: amt },
    ],
    date,
  });
  return {
    newEntries: [entry],
    invoices: s.invoices,
    deposits: s.deposits,
    payments: s.payments,
    explanation: entry.plainEnglish,
  };
}
