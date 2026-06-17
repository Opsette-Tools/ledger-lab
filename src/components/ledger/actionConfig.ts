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

export const FORWARD_ACTIONS: Array<{ key: ActionKey; label: string }> = [
  { key: "send_invoice", label: "Send invoice" },
  { key: "record_payment", label: "Record payment" },
  { key: "take_deposit", label: "Take deposit" },
  { key: "complete_work", label: "Mark work complete" },
  { key: "record_expense", label: "Record expense" },
];

export const REVERSE_ACTIONS: Array<{ key: ActionKey; label: string }> = [
  { key: "cancel_invoice", label: "Cancel unpaid invoice" },
  { key: "credit_memo", label: "Issue credit memo" },
  { key: "refund_payment", label: "Refund a payment" },
  { key: "forfeit_deposit", label: "Forfeit a deposit" },
  { key: "write_off", label: "Write off bad debt" },
  { key: "discount", label: "Apply post-send discount" },
  { key: "void", label: "Void invoice (no payments)" },
];

export const SPECIAL_ACTIONS: Array<{ key: ActionKey; label: string; tip: string }> = [
  {
    key: "prepaid",
    label: "Receive prepaid contract",
    tip: "Receive cash now for a multi-month contract. Try it in both modes to see the difference.",
  },
  {
    key: "recognize",
    label: "Recognize 1 month of deferred",
    tip: "Move one month of deferred revenue into earned (accrual only).",
  },
];
