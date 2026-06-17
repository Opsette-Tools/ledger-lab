import { Form, Input, InputNumber, Select } from "antd";
import type { FormInstance } from "antd";
import { useLedger } from "../../state/ledgerStore";
import type { ActionKey } from "./actionConfig";
import { fmt } from "./format";

type Snapshot = ReturnType<typeof useLedger>["snapshot"];

/**
 * The per-action form fields. Each action collects only what its handler needs;
 * dropdowns are filtered to the relevant open invoices / held deposits / etc.
 */
export function ActionForm({
  form,
  actionKey,
  snapshot,
}: {
  form: FormInstance;
  actionKey: ActionKey;
  snapshot: Snapshot;
}) {
  const openInvoices = snapshot.invoices.filter(
    (i) => i.status === "sent" || i.status === "partially_paid",
  );
  const cancellableInvoices = snapshot.invoices.filter(
    (i) => i.paidAmount === 0 && (i.status === "sent" || i.status === "draft"),
  );
  const heldDeposits = snapshot.deposits.filter((d) => d.status === "held");
  const payments = snapshot.payments.filter((p) => p.refundedAmount < p.amount);

  switch (actionKey) {
    case "send_invoice":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Customer" name="customer" rules={[{ required: true }]} initialValue="Acme Co.">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={500}>
            <InputNumber min={0.01} step={50} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      );
    case "record_payment":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Invoice" name="invoiceId" rules={[{ required: true }]}>
            <Select
              placeholder="Pick an open invoice"
              options={openInvoices.map((i) => ({
                value: i.id,
                label: `${i.customer} — ${fmt(i.amount)} (paid ${fmt(i.paidAmount)})`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={50} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      );
    case "take_deposit":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Customer" name="customer" rules={[{ required: true }]} initialValue="Beta LLC">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={300}>
            <InputNumber min={0.01} step={50} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      );
    case "complete_work":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Held deposit" name="depositId" rules={[{ required: true }]}>
            <Select
              placeholder="Pick a held deposit"
              options={heldDeposits.map((d) => ({
                value: d.id,
                label: `${d.customer} — ${fmt(d.amount)} (${d.modeWhenTaken})`,
              }))}
            />
          </Form.Item>
        </Form>
      );
    case "record_expense":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Category" name="category" rules={[{ required: true }]} initialValue="Office supplies">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={100}>
            <InputNumber min={0.01} step={10} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      );
    case "cancel_invoice":
    case "void":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Invoice" name="invoiceId" rules={[{ required: true }]}>
            <Select
              placeholder="Pick an unpaid invoice"
              options={cancellableInvoices.map((i) => ({
                value: i.id,
                label: `${i.customer} — ${fmt(i.amount)}`,
              }))}
            />
          </Form.Item>
        </Form>
      );
    case "credit_memo":
    case "discount":
    case "write_off":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Invoice" name="invoiceId" rules={[{ required: true }]}>
            <Select
              placeholder="Pick an invoice"
              options={snapshot.invoices.map((i) => ({
                value: i.id,
                label: `${i.customer} — ${fmt(i.amount)} (${i.status})`,
              }))}
            />
          </Form.Item>
          {actionKey !== "write_off" && (
            <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]}>
              <InputNumber min={0.01} step={50} style={{ width: "100%" }} />
            </Form.Item>
          )}
        </Form>
      );
    case "refund_payment":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Payment" name="paymentId" rules={[{ required: true }]}>
            <Select
              placeholder="Pick a payment"
              options={payments.map((p) => {
                const inv = snapshot.invoices.find((i) => i.id === p.invoiceId);
                return {
                  value: p.id,
                  label: `${inv?.customer ?? "?"} — ${fmt(p.amount)} (refunded ${fmt(p.refundedAmount)})`,
                };
              })}
            />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={50} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      );
    case "forfeit_deposit":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Held deposit" name="depositId" rules={[{ required: true }]}>
            <Select
              placeholder="Pick a held deposit"
              options={heldDeposits.map((d) => ({
                value: d.id,
                label: `${d.customer} — ${fmt(d.amount)}`,
              }))}
            />
          </Form.Item>
        </Form>
      );
    case "prepaid":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Customer" name="customer" rules={[{ required: true }]} initialValue="Yearly Client">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={6000}>
            <InputNumber min={1} step={1000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Contract months" name="months" rules={[{ required: true }]} initialValue={6}>
            <InputNumber min={1} max={36} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      );
    case "recognize":
      return (
        <Form form={form} layout="vertical">
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={1000}>
            <InputNumber min={0.01} step={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Month label" name="monthLabel" rules={[{ required: true }]} initialValue="Next month">
            <Input />
          </Form.Item>
        </Form>
      );
  }
}
