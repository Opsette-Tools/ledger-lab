export type ActionKey =
  | "send_invoice"
  | "record_payment"
  | "take_deposit"
  | "complete_work"
  | "record_expense"
  | "cancel_invoice"
  | "credit_memo"
  | "refund_payment"
  | "forfeit_deposit"
  | "write_off"
  | "discount"
  | "void"
  | "prepaid"
  | "recognize";

export const TITLES: Record<ActionKey, string> = {
  send_invoice: "Send invoice",
  record_payment: "Record payment",
  take_deposit: "Take deposit",
  complete_work: "Mark work complete",
  record_expense: "Record expense",
  cancel_invoice: "Cancel unpaid invoice",
  credit_memo: "Issue credit memo",
  refund_payment: "Refund a payment",
  forfeit_deposit: "Forfeit a deposit",
  write_off: "Write off bad debt",
  discount: "Apply discount",
  void: "Void invoice",
  prepaid: "Receive prepaid contract",
  recognize: "Recognize deferred revenue",
};

// Events grouped by RELATIONSHIP, not category — so the layout shows what
// connects to what. Three shapes:
//   - "story":  two faces of one thing (bill → get paid). Shown as step → step.
//   - "single": genuinely one-and-done, no second face.
//   - "undo":   reverses an earlier event; each labels WHAT it undoes.

export interface StoryGroup {
  kind: "story";
  title: string;
  /** The two linked steps, shown with an arrow between them. */
  first: { key: ActionKey; label: string };
  second: { key: ActionKey; label: string };
}

export interface SingleGroup {
  kind: "single";
  title: string;
  actions: Array<{ key: ActionKey; label: string }>;
}

export interface UndoGroup {
  kind: "undo";
  title: string;
  note: string;
  /** Each reversal labels what it undoes. */
  actions: Array<{ key: ActionKey; label: string; undoes: string }>;
}

export type EventGroup = StoryGroup | SingleGroup | UndoGroup;

export const EVENT_GROUPS: EventGroup[] = [
  {
    kind: "story",
    title: "The invoice story",
    first: { key: "send_invoice", label: "Send invoice" },
    second: { key: "record_payment", label: "Record payment" },
  },
  {
    kind: "story",
    title: "The deposit story",
    first: { key: "take_deposit", label: "Take deposit" },
    second: { key: "complete_work", label: "Mark work complete" },
  },
  {
    kind: "story",
    title: "The prepaid-contract story",
    first: { key: "prepaid", label: "Receive prepaid contract" },
    second: { key: "recognize", label: "Recognize 1 month earned" },
  },
  {
    kind: "single",
    title: "One-and-done",
    actions: [
      { key: "record_expense", label: "Record expense" },
    ],
  },
  {
    kind: "undo",
    title: "Undo (reverse — you never delete in a ledger)",
    note: "A ledger is permanent — you don't erase history, you post an entry that cancels it. Each of these undoes a specific earlier event.",
    actions: [
      { key: "refund_payment", label: "Refund a payment", undoes: "undoes a payment" },
      { key: "credit_memo", label: "Issue credit memo", undoes: "undoes part of an invoice" },
      { key: "cancel_invoice", label: "Cancel unpaid invoice", undoes: "undoes an unpaid invoice" },
      { key: "void", label: "Void invoice", undoes: "voids an invoice with no payments" },
      { key: "discount", label: "Apply discount", undoes: "trims an invoice after sending" },
      { key: "write_off", label: "Write off bad debt", undoes: "gives up a receivable you won't collect" },
      { key: "forfeit_deposit", label: "Forfeit a deposit", undoes: "keeps a dead deposit as income" },
    ],
  },
];
