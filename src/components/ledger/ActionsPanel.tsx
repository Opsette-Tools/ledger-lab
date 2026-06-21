import { useState } from "react";
import { App as AntApp, Button, Card, Collapse, Form, Modal, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useLedger } from "../../state/ledgerStore";
import * as A from "../../lib/accounting/actions";
import { EVENT_GROUPS, TITLES, type ActionKey, type EventGroup } from "./actionConfig";
import { ActionForm } from "./ActionForm";

const { Text } = Typography;

/**
 * Free-play action board, grouped by RELATIONSHIP so the structure teaches what
 * connects to what: paired "stories" (send invoice → record payment) shown as
 * linked steps, genuinely standalone events on their own, and reversals grouped
 * with what each one undoes (because in a ledger you reverse, you never delete).
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
    <Card
      size="small"
      title="Record an event"
      styles={{ header: { background: "#eef3f1", color: "#2f4f46" } }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {EVENT_GROUPS.map((group) => (
          <Group key={group.title} group={group} onOpen={setOpenKey} />
        ))}
      </div>

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

function Group({ group, onOpen }: { group: EventGroup; onOpen: (k: ActionKey) => void }) {
  return (
    <div>
      <Text strong style={{ fontSize: 11, color: "#7a7a7a", textTransform: "uppercase", letterSpacing: 0.4 }}>
        {group.title}
      </Text>

      {group.kind === "story" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <Button size="small" onClick={() => onOpen(group.first.key)}>
            {group.first.label}
          </Button>
          <ArrowRightOutlined style={{ color: "#bbb" }} />
          <Button size="small" onClick={() => onOpen(group.second.key)}>
            {group.second.label}
          </Button>
        </div>
      )}

      {group.kind === "single" && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {group.actions.map((a) => (
            <Button key={a.key} size="small" onClick={() => onOpen(a.key)}>
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {group.kind === "undo" && (
        // Collapsed by default — these reversals are the bulk of the height and
        // the least-used events, so they tuck away to keep the panel compact.
        <Collapse
          size="small"
          ghost
          style={{ marginTop: 4 }}
          items={[
            {
              key: "undo",
              label: (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Show reversals ({group.actions.length})
                </Text>
              ),
              children: (
                <>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                    {group.note}
                  </Text>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {group.actions.map((a) => (
                      <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Button
                          size="small"
                          onClick={() => onOpen(a.key)}
                          style={{ minWidth: 150, textAlign: "left" }}
                        >
                          {a.label}
                        </Button>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {a.undoes}
                        </Text>
                      </div>
                    ))}
                  </div>
                </>
              ),
            },
          ]}
        />
      )}
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
