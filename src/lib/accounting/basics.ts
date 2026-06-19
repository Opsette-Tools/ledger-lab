// Accounting Basics — the teaching data behind the "learn by feel" tab.
//
// Source: docs/ACCOUNTING_BASICS_ACCOUNTS.md (the approved curated set of 11
// representative accounts). The ONE rule everything hangs on:
//
//   Assets & Expenses          → home side is DEBIT  (debit makes them go UP)
//   Liabilities, Equity, Income → home side is CREDIT (credit makes them go UP)
//
// The lone exception is a contra account (Sales Discounts): an income account
// that lives on the debit side because its job is to REDUCE income. Met last,
// after the main rule is solid — the "aha, I actually get it" moment.

export type BasicsType = "asset" | "liability" | "equity" | "income" | "expense";
export type HomeSide = "debit" | "credit";

export interface BasicsAccount {
  name: string;
  type: BasicsType;
  /** The side that makes this account go UP. */
  homeSide: HomeSide;
  /** Plain-language, one line — what this account IS. */
  meaning: string;
  /** A concrete "you'd use this when…" so the learner can reason about the side
   *  instead of guessing. Scenario-based, in the language of a small business. */
  whenToUse: string;
  /** true for the contra account — the rule-proving exception. */
  contra?: boolean;
}

export const BASICS_ACCOUNTS: BasicsAccount[] = [
  {
    name: "Cash",
    type: "asset",
    homeSide: "debit",
    meaning: "Money you actually have, on hand or in the bank.",
    whenToUse: "Use it whenever real money moves in or out — a client pays you, or you pay a bill.",
  },
  {
    name: "Accounts Receivable",
    type: "asset",
    homeSide: "debit",
    meaning: "Money customers owe you but haven't paid yet.",
    whenToUse: "Use it when you've billed a client and are waiting to be paid — it's a promise of cash you own.",
  },
  {
    name: "Customer Deposits",
    type: "liability",
    homeSide: "credit",
    meaning: "Money a customer paid up front before you did the work — you “owe” them the work.",
    whenToUse: "Use it when a client pays a deposit before you've started — you're holding money you haven't earned.",
  },
  {
    name: "Deferred Revenue",
    type: "liability",
    homeSide: "credit",
    meaning: "Money paid up front for work spread over time — earned bit by bit.",
    whenToUse: "Use it when a client prepays for a multi-month project — you owe the work and earn the money over time.",
  },
  {
    name: "Accounts Payable",
    type: "liability",
    homeSide: "credit",
    meaning: "Money YOU owe a vendor or supplier but haven't paid yet.",
    whenToUse: "Use it when a vendor bills you and you'll pay later — it's a debt you owe, the mirror of Accounts Receivable.",
  },
  {
    name: "Owner's Equity",
    type: "equity",
    homeSide: "credit",
    meaning: "What the owner has put into (or built up in) the business.",
    whenToUse: "Use it when you put your own money into the business to get it going or keep it running.",
  },
  {
    name: "Sales Revenue",
    type: "income",
    homeSide: "credit",
    meaning: "Money you earned from doing the work or selling.",
    whenToUse: "Use it when you've actually earned money — finished a website, delivered the goods, completed the job.",
  },
  {
    name: "Forfeited Deposit Income",
    type: "income",
    homeSide: "credit",
    meaning: "A kept non-refundable deposit when a deal dies — you earned it as a cancellation fee.",
    whenToUse: "Use it when a client cancels and you keep their non-refundable deposit — that money is now yours, earned.",
  },
  {
    name: "Sales Discounts",
    type: "income",
    homeSide: "debit",
    contra: true,
    meaning:
      "The “backwards” one — an income account that lives on the debit side because its job is to reduce income.",
    whenToUse: "Use it when you knock money off a price after billing — it trims your income rather than adding to it.",
  },
  {
    name: "Operating Expenses",
    type: "expense",
    homeSide: "debit",
    meaning: "Money you spend to run the business (rent, software, supplies).",
    whenToUse: "Use it for the everyday costs of running the business — rent, software subscriptions, office supplies.",
  },
  {
    name: "Bad Debt Expense",
    type: "expense",
    homeSide: "debit",
    meaning: "Money a customer owed that you've given up collecting — booked as a loss.",
    whenToUse: "Use it when a client will never pay what they owe — you give up collecting and record the loss.",
  },
];

/**
 * Display info per side. We teach the POSITIONS (Left / Right) rather than the
 * traditional words "debit" / "credit", which fight everyone's intuition. The
 * official names live only in the tab heading as a forgettable aside — never on
 * the cards. (The internal keys stay debit/credit because that's what the
 * accounting engine uses; only the labels change.)
 *
 *   Left  = where the money WENT     → things you hold + what it costs to keep them
 *   Right = where the money CAME FROM → income, what you owe, what you put in
 */
export const HOME_SIDE_INFO: Record<HomeSide, { label: string; blurb: string; types: string; rule: string }> = {
  debit: {
    label: "Left",
    blurb: "What value went toward",
    types: "Assets & Expenses",
    rule: "Things you hold, and what it cost to keep them.",
  },
  credit: {
    label: "Right",
    blurb: "Where value came from",
    types: "Liabilities, Equity & Income",
    rule: "What you owe, what you put in, and what you earned.",
  },
};

export const TYPE_LABEL: Record<BasicsType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income",
  expense: "Expense",
};

// ---------- Step 0: the five account types and their home side ----------
//
// The foundation. Lock the 5 TYPES into Left/Right first, and every account
// inherits its side from its type — the cheat that makes Step 1 easy. Kept
// clean: no contra here, just a light asterisk on Income noting one exception
// exists (the learner meets Sales Discounts in Step 1, where it lives).

export interface TypeCard {
  type: BasicsType;
  homeSide: HomeSide;
  /** Plain-language: what this whole family of accounts is. */
  meaning: string;
  /** A concrete example or two, in small-business language. */
  example: string;
  /** Light note (e.g. the income contra exception) — shown subtly, not taught here. */
  note?: string;
}

export const TYPE_CARDS: TypeCard[] = [
  {
    type: "asset",
    homeSide: "debit",
    meaning: "Things you hold — money and stuff you own.",
    example: "Cash, money customers owe you, equipment.",
  },
  {
    type: "expense",
    homeSide: "debit",
    meaning: "Value you used up to run the business.",
    example: "Rent, software, supplies, a loss you absorbed.",
  },
  {
    type: "liability",
    homeSide: "credit",
    meaning: "What you owe to someone else.",
    example: "A vendor bill, a deposit you owe work for.",
  },
  {
    type: "equity",
    homeSide: "credit",
    meaning: "What the owner put in or built up in the business.",
    example: "Money you invested to get it going.",
  },
  {
    type: "income",
    homeSide: "credit",
    meaning: "Money you earned from doing the work or selling.",
    example: "Sales revenue, service revenue.",
    note: "One income account breaks this rule (a “contra”) — you'll meet it in Step 1.",
  },
];

/** Look an account up by name (the events reference accounts by name). */
export function accountByName(name: string): BasicsAccount {
  const a = BASICS_ACCOUNTS.find((x) => x.name === name);
  if (!a) throw new Error(`Unknown basics account: ${name}`);
  return a;
}

export type Direction = "up" | "down";

/**
 * Which side a movement LANDS on:
 *   up   → the account's home side
 *   down → the opposite side
 * This is the single rule from Step 2 — used everywhere so it stays consistent.
 */
export function landingSide(account: BasicsAccount, direction: Direction): HomeSide {
  if (direction === "up") return account.homeSide;
  return account.homeSide === "debit" ? "credit" : "debit";
}

// ---------- Step 3: the counterbalance (real events → two balanced sides) ----------

export interface EventMove {
  /** Account name (must match a BASICS_ACCOUNTS name). */
  account: string;
  direction: Direction;
  /** Plain-language reason this account moves, revealed after a correct build. */
  why: string;
}

export interface LedgerEvent {
  id: string;
  /** Short label for the event picker. */
  shortLabel: string;
  /** The plain-language event the learner reads before building the entry. */
  prompt: string;
  amount: number;
  /** Exactly the two accounts that move — one lands Left, one lands Right. */
  moves: [EventMove, EventMove];
  /** The one-line lesson shown once the entry balances. */
  lesson: string;
}

export const LEDGER_EVENTS: LedgerEvent[] = [
  {
    id: "cash-sale",
    shortLabel: "Cash sale",
    prompt: "A customer pays you $200 cash and walks out with the goods.",
    amount: 200,
    moves: [
      { account: "Cash", direction: "up", why: "You have $200 more in the bank — Cash goes up." },
      { account: "Sales Revenue", direction: "up", why: "You earned it by making the sale — Revenue goes up." },
    ],
    lesson:
      "Both went UP, but they land on opposite sides — Cash (asset) on the Left, Sales Revenue (income) on the Right — so the entry balances.",
  },
  {
    id: "send-invoice",
    shortLabel: "Send invoice",
    prompt: "You finish a website and send the client a $500 invoice. No cash yet.",
    amount: 500,
    moves: [
      { account: "Accounts Receivable", direction: "up", why: "They now owe you $500 — what you're owed goes up." },
      { account: "Sales Revenue", direction: "up", why: "You earned it by doing the work — Revenue goes up." },
    ],
    lesson:
      "You earned money before any cash arrived: Accounts Receivable (an asset, a promise of cash) on the Left, Sales Revenue on the Right.",
  },
  {
    id: "client-pays",
    shortLabel: "Client pays",
    prompt: "The client pays the $500 invoice they owed you.",
    amount: 500,
    moves: [
      { account: "Cash", direction: "up", why: "The money actually arrived — Cash goes up." },
      { account: "Accounts Receivable", direction: "down", why: "They don't owe you anymore — what you're owed goes down." },
    ],
    lesson:
      "Here's the jump-ship moment: Accounts Receivable goes DOWN, so it lands on the Right — even though its home is the Left. No new income; the promise just turned into cash.",
  },
  {
    id: "pay-rent",
    shortLabel: "Pay rent",
    prompt: "You pay $100 cash for this month's rent.",
    amount: 100,
    moves: [
      { account: "Operating Expenses", direction: "up", why: "Running costs went up by $100 — the expense goes up." },
      { account: "Cash", direction: "down", why: "Money left the bank — Cash goes down." },
    ],
    lesson:
      "An expense going up lands on the Left; Cash going down lands on the Right. Value left you and turned into a cost.",
  },
  {
    id: "take-deposit",
    shortLabel: "Take deposit",
    prompt: "A client pays a $300 deposit up front, before you've done any work.",
    amount: 300,
    moves: [
      { account: "Cash", direction: "up", why: "You're holding $300 more — Cash goes up." },
      { account: "Customer Deposits", direction: "up", why: "You owe them the work — this liability goes up." },
    ],
    lesson:
      "You have the cash, but you haven't earned it — so it's NOT revenue. Cash (asset) on the Left, Customer Deposits (a liability you owe) on the Right.",
  },
  {
    id: "owner-invests",
    shortLabel: "Owner invests",
    prompt: "You put $1,000 of your own money into the business.",
    amount: 1000,
    moves: [
      { account: "Cash", direction: "up", why: "The business has $1,000 more — Cash goes up." },
      { account: "Owner's Equity", direction: "up", why: "That's value you put in — your equity goes up." },
    ],
    lesson:
      "The value came FROM you (Owner's Equity, Right) and landed AS cash (asset, Left). Source and destination, balanced.",
  },
];
