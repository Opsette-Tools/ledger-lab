import { useState } from "react";
import { App as AntApp, Button, Card, Form, Modal, Space, Tooltip, Typography } from "antd";
import { useLedger } from "../../state/ledgerStore";
import * as A from "../../lib/accounting/actions";
import {
  FORWARD_ACTIONS,
  REVERSE_ACTIONS,
  SPECIAL_ACTIONS,
  TITLES,
  type ActionKey,
} from "./actionConfig";
import { ActionForm } from "./ActionForm";

const { Text } = Typography;

/**
 * Free-play action board. Three grouped lanes — money in (forward), reverse
 * (money back), and the two special prepaid/recognize actions — each opening a
 * small form modal. This is the "poke at it yourself" half of Explore.
 */
export function ActionsPanel() {
  const { snapshot, apply } = useLedger();
  const { modal } = AntApp.useApp();
  const [openKey, setOpenKey] = useState<ActionKey | null>(null);
  const [form] = Form.useForm();

  const submit = async () => {
    if (!openKey) return;
    try {
      const values = await form.validateFields();
      runAction(openKey, values, apply);
      form.resetFields();
      setOpenKey(null);
    } catch (err) {
      if ((err as { errorFields?: unknown })?.errorFields) return; // form validation handled inline
      const msg = err instanceof Error ? err.message : "Could not perform action";
      modal.error({ title: "Couldn't post that entry", content: msg });
    }
  };

  const close = () => {
    form.resetFields();
    setOpenKey(null);
  };

  return (
    <Card size="small" title="Record an event">
      <Lane label="Money in / forward" color="#389e0d">
        {FORWARD_ACTIONS.map((a) => (
          <Button key={a.key} size="small" onClick={() => setOpenKey(a.key)}>
            {a.label}
          </Button>
        ))}
      </Lane>

      <Lane label="Reverse / money back" color="#fa8c16">
        {REVERSE_ACTIONS.map((a) => (
          <Button key={a.key} size="small" onClick={() => setOpenKey(a.key)}>
            {a.label}
          </Button>
        ))}
      </Lane>

      <Lane label="Special" color="#722ed1">
        {SPECIAL_ACTIONS.map((a) => (
          <Tooltip key={a.key} title={a.tip}>
            <Button size="small" onClick={() => setOpenKey(a.key)}>
              {a.label}
            </Button>
          </Tooltip>
        ))}
      </Lane>

      <Modal
        title={openKey ? TITLES[openKey] : ""}
        open={openKey !== null}
        onCancel={close}
        onOk={submit}
        okText="Post"
        destroyOnHidden
      >
        {openKey && <ActionForm form={form} actionKey={openKey} snapshot={snapshot} />}
      </Modal>
    </Card>
  );
}

function Lane({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Text strong style={{ fontSize: 11, color, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Space wrap style={{ marginTop: 6, display: "flex" }}>
        {children}
      </Space>
    </div>
  );
}

function runAction(
  key: ActionKey,
  v: Record<string, unknown>,
  apply: ReturnType<typeof useLedger>["apply"],
) {
  const num = (k: string) => Number(v[k]);
  const str = (k: string) => String(v[k]);
  switch (key) {
    case "send_invoice":
      return apply((s) => A.sendInvoice(s, { amount: num("amount"), customer: str("customer") }));
    case "record_payment":
      return apply((s) => A.recordPayment(s, { invoiceId: str("invoiceId"), amount: num("amount") }));
    case "take_deposit":
      return apply((s) => A.takeDeposit(s, { amount: num("amount"), customer: str("customer") }));
    case "complete_work":
      return apply((s) => A.completeWork(s, { depositId: str("depositId") }));
    case "record_expense":
      return apply((s) => A.recordExpense(s, { amount: num("amount"), category: str("category") }));
    case "cancel_invoice":
      return apply((s) => A.cancelUnpaidInvoice(s, { invoiceId: str("invoiceId") }));
    case "void":
      return apply((s) => A.voidInvoice(s, { invoiceId: str("invoiceId") }));
    case "credit_memo":
      return apply((s) => A.issueCreditMemo(s, { invoiceId: str("invoiceId"), amount: num("amount") }));
    case "refund_payment":
      return apply((s) => A.refundPayment(s, { paymentId: str("paymentId"), amount: num("amount") }));
    case "forfeit_deposit":
      return apply((s) => A.forfeitDeposit(s, { depositId: str("depositId") }));
    case "write_off":
      return apply((s) => A.writeOffBadDebt(s, { invoiceId: str("invoiceId") }));
    case "discount":
      return apply((s) => A.applyDiscount(s, { invoiceId: str("invoiceId"), amount: num("amount") }));
    case "prepaid":
      return apply((s) =>
        A.receivePrepaidContract(s, {
          amount: num("amount"),
          customer: str("customer"),
          months: num("months"),
        }),
      );
    case "recognize":
      return apply((s) => A.recognizeDeferred(s, { amount: num("amount"), monthLabel: str("monthLabel") }));
  }
}
