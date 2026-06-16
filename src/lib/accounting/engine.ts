// Pure double-entry accounting engine. No React, no side effects.
// Invariant: every JournalEntry has sum(debits) === sum(credits).

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type NormalSide = "debit" | "credit";
export type Mode = "cash" | "accrual";

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  normal: NormalSide;
  /** true for contra accounts (e.g. Sales Discounts is a debit-normal contra-revenue) */
  contra?: boolean;
}

export interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO
  mode: Mode;
  description: string;
  plainEnglish: string;
  lines: JournalLine[];
  /** soft-link to a domain object (invoice id, deposit id, etc.) */
  sourceRef?: string;
  /** true when nothing posted (cash-mode no-op) — kept for the teaching log */
  informational?: boolean;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "partially_paid"
  | "cancelled"
  | "voided"
  | "written_off";

export interface Invoice {
  id: string;
  customer: string;
  amount: number;
  paidAmount: number;
  discountAmount: number;
  creditedAmount: number;
  status: InvoiceStatus;
  modeWhenSent: Mode | null; // null if never sent
}

export interface Deposit {
  id: string;
  customer: string;
  amount: number;
  status: "held" | "completed" | "forfeited";
  modeWhenTaken: Mode;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  refundedAmount: number;
  mode: Mode;
}

export const ACCOUNTS: Account[] = [
  { code: "1000", name: "Cash", type: "asset", normal: "debit" },
  { code: "1100", name: "Accounts Receivable", type: "asset", normal: "debit" },
  { code: "2050", name: "Customer Deposits", type: "liability", normal: "credit" },
  { code: "2100", name: "Deferred Revenue", type: "liability", normal: "credit" },
  { code: "3000", name: "Owner's Equity", type: "equity", normal: "credit" },
  { code: "4000", name: "Sales Revenue", type: "income", normal: "credit" },
  { code: "4100", name: "Forfeited Deposit Income", type: "income", normal: "credit" },
  { code: "4900", name: "Sales Discounts", type: "income", normal: "debit", contra: true },
  { code: "5000", name: "Operating Expenses", type: "expense", normal: "debit" },
  { code: "5500", name: "Bad Debt Expense", type: "expense", normal: "debit" },
];

export const accountByCode = (code: string): Account => {
  const a = ACCOUNTS.find((x) => x.code === code);
  if (!a) throw new Error(`Unknown account: ${code}`);
  return a;
};

// ---------- Entry construction (the single chokepoint) ----------

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildEntry(input: {
  mode: Mode;
  description: string;
  plainEnglish: string;
  lines: Array<{ accountCode: string; debit?: number; credit?: number }>;
  sourceRef?: string;
  informational?: boolean;
  date?: string;
}): JournalEntry {
  const lines: JournalLine[] = input.lines.map((l) => ({
    accountCode: l.accountCode,
    debit: round2(l.debit ?? 0),
    credit: round2(l.credit ?? 0),
  }));
  const totalDebit = round2(lines.reduce((s, l) => s + l.debit, 0));
  const totalCredit = round2(lines.reduce((s, l) => s + l.credit, 0));
  if (!input.informational && totalDebit !== totalCredit) {
    throw new Error(
      `Unbalanced entry: debits ${totalDebit} != credits ${totalCredit} — "${input.description}"`,
    );
  }
  return {
    id: cryptoId(),
    date: input.date ?? new Date().toISOString(),
    mode: input.mode,
    description: input.description,
    plainEnglish: input.plainEnglish,
    lines,
    sourceRef: input.sourceRef,
    informational: input.informational,
  };
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

// ---------- Balances & reports ----------

/** Signed balance using normal side: positive means "in the natural direction". */
export function balanceFor(code: string, entries: JournalEntry[]): number {
  const acc = accountByCode(code);
  let total = 0;
  for (const e of entries) {
    if (e.informational) continue;
    for (const l of e.lines) {
      if (l.accountCode !== code) continue;
      total += acc.normal === "debit" ? l.debit - l.credit : l.credit - l.debit;
    }
  }
  return round2(total);
}

export interface TrialBalanceRow {
  account: Account;
  debit: number;
  credit: number;
}

export function trialBalance(entries: JournalEntry[]): {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
} {
  const rows: TrialBalanceRow[] = ACCOUNTS.map((acc) => {
    let d = 0;
    let c = 0;
    for (const e of entries) {
      if (e.informational) continue;
      for (const l of e.lines) {
        if (l.accountCode === acc.code) {
          d += l.debit;
          c += l.credit;
        }
      }
    }
    // Net into the normal side for display
    const net = acc.normal === "debit" ? d - c : c - d;
    return acc.normal === "debit"
      ? { account: acc, debit: Math.max(round2(net), 0), credit: net < 0 ? round2(-net) : 0 }
      : { account: acc, debit: net < 0 ? round2(-net) : 0, credit: Math.max(round2(net), 0) };
  });
  const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0));
  return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}

export interface PnL {
  revenue: number;
  contraRevenue: number;
  netRevenue: number;
  expenses: number;
  netIncome: number;
  byAccount: Array<{ account: Account; amount: number }>;
}

export function profitAndLoss(entries: JournalEntry[]): PnL {
  let revenue = 0;
  let contraRevenue = 0;
  let expenses = 0;
  const byAccount: PnL["byAccount"] = [];
  for (const acc of ACCOUNTS) {
    if (acc.type !== "income" && acc.type !== "expense") continue;
    const bal = balanceFor(acc.code, entries);
    byAccount.push({ account: acc, amount: bal });
    if (acc.type === "income") {
      if (acc.contra) contraRevenue += bal;
      else revenue += bal;
    } else if (acc.type === "expense") {
      expenses += bal;
    }
  }
  const netRevenue = round2(revenue - contraRevenue);
  return {
    revenue: round2(revenue),
    contraRevenue: round2(contraRevenue),
    netRevenue,
    expenses: round2(expenses),
    netIncome: round2(netRevenue - expenses),
    byAccount,
  };
}

export interface BalanceSheet {
  assets: Array<{ account: Account; amount: number }>;
  liabilities: Array<{ account: Account; amount: number }>;
  equity: number;
  totalAssets: number;
  totalLiabilities: number;
  retainedEarnings: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
}

export function balanceSheet(entries: JournalEntry[]): BalanceSheet {
  const assets = ACCOUNTS.filter((a) => a.type === "asset").map((a) => ({
    account: a,
    amount: balanceFor(a.code, entries),
  }));
  const liabilities = ACCOUNTS.filter((a) => a.type === "liability").map((a) => ({
    account: a,
    amount: balanceFor(a.code, entries),
  }));
  const equity = balanceFor("3000", entries);
  const retainedEarnings = profitAndLoss(entries).netIncome;
  const totalAssets = round2(assets.reduce((s, a) => s + a.amount, 0));
  const totalLiabilities = round2(liabilities.reduce((s, a) => s + a.amount, 0));
  const totalLiabilitiesAndEquity = round2(totalLiabilities + equity + retainedEarnings);
  return {
    assets,
    liabilities,
    equity,
    retainedEarnings,
    totalAssets,
    totalLiabilities,
    totalLiabilitiesAndEquity,
    balanced: totalAssets === totalLiabilitiesAndEquity,
  };
}

// ---------- Monthly revenue (for scenario e visualization) ----------

export function monthlyRevenue(entries: JournalEntry[]): Array<{ month: string; amount: number }> {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.informational) continue;
    const month = e.date.slice(0, 7); // YYYY-MM
    for (const l of e.lines) {
      const acc = accountByCode(l.accountCode);
      if (acc.type === "income" && !acc.contra) {
        const delta = l.credit - l.debit;
        map.set(month, round2((map.get(month) ?? 0) + delta));
      }
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}
