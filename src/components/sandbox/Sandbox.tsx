import { useMemo, useState } from "react";
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Steps,
  Tabs,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme as antdTheme,
} from "antd";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useLedger } from "../../state/ledgerStore";
import {
  ACCOUNTS,
  accountByCode,
  balanceFor,
  balanceSheet,
  monthlyRevenue,
  profitAndLoss,
  trialBalance,
  type JournalEntry,
  type Mode,
} from "../../lib/accounting/engine";
import * as A from "../../lib/accounting/actions";
import { SCENARIOS, type Scenario } from "../../lib/accounting/scenarios";

const { Title, Text, Paragraph } = Typography;

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function Sandbox() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        algorithm: antdTheme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <SandboxInner />
      </AntApp>
    </ConfigProvider>
  );
}

function SandboxInner() {
  const isMobile = useIsMobile();
  const { state, snapshot, setMode, reset } = useLedger();
  const tb = useMemo(() => trialBalance(state.entries), [state.entries]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6f8",
        padding: isMobile ? 12 : 24,
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <HeaderBar
          mode={state.mode}
          onMode={setMode}
          onReset={reset}
          balanced={tb.balanced}
          isMobile={isMobile}
        />
        <ConceptHeader />
        <ExplanationCard text={state.lastExplanation} mode={state.mode} />

        {isMobile ? (
          <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 12 }}>
            <ActionsPanel />
            <Tabs
              defaultActiveKey="journal"
              size="small"
              items={[
                { key: "journal", label: "Journal", children: <JournalPanel /> },
                { key: "reports", label: "Reports", children: <ReportsPanel /> },
              ]}
            />
            <ScenariosPanel />
            <MonthlyRevenuePanel />
          </Space>
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
              <Col xs={24} md={7}>
                <ActionsPanel />
              </Col>
              <Col xs={24} md={10}>
                <JournalPanel />
              </Col>
              <Col xs={24} md={7}>
                <ReportsPanel />
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} md={14}>
                <ScenariosPanel />
              </Col>
              <Col xs={24} md={10}>
                <MonthlyRevenuePanel />
              </Col>
            </Row>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 24, color: "#888", fontSize: 12 }}>
          Double-entry accounting sandbox · A teaching tool · All data lives in your browser
        </div>
      </div>
    </div>
  );
}

// ---------- Header ----------

function HeaderBar({
  mode,
  onMode,
  onReset,
  balanced,
  isMobile,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  onReset: () => void;
  balanced: boolean;
  isMobile: boolean;
}) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      styles={{ body: { padding: isMobile ? 12 : 16 } }}
    >
      <Row gutter={[12, 12]} align="middle" wrap>
        <Col flex="auto" style={{ minWidth: 0 }}>
          <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
            Double-Entry Accounting Sandbox
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Watch the same business event hit the books differently in Cash vs. Accrual mode.
          </Text>
        </Col>
        <Col>
          <Space size="small" wrap>
            <Segmented
              size={isMobile ? "small" : "middle"}
              value={mode}
              onChange={(v) => onMode(v as Mode)}
              options={[
                { label: "Cash", value: "cash" },
                { label: "Accrual", value: "accrual" },
              ]}
            />
            <Tag color={balanced ? "green" : "red"} style={{ margin: 0 }}>
              {balanced ? "Balanced ✓" : "OUT OF BALANCE"}
            </Tag>
            <Button danger size={isMobile ? "small" : "middle"} onClick={onReset}>
              Reset
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}

function ConceptHeader() {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
      <Col xs={24} md={12}>
        <Card
          size="small"
          style={{ borderLeft: "4px solid #52c41a", height: "100%" }}
          title={
            <span style={{ color: "#389e0d" }}>
              Cash basis — “money counts when it MOVES”
            </span>
          }
        >
          <Text style={{ fontSize: 13 }}>
            Revenue is recorded when cash is received; expenses when cash is paid. Simple, maps
            to your bank account — but timing can distort the true picture.
          </Text>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card
          size="small"
          style={{ borderLeft: "4px solid #1677ff", height: "100%" }}
          title={
            <span style={{ color: "#0958d9" }}>
              Accrual basis — “money counts when it’s EARNED”
            </span>
          }
        >
          <Text style={{ fontSize: 13 }}>
            Revenue is recorded when earned and expenses when incurred — regardless of when
            cash moves. Matches income and costs to the period they belong to.
          </Text>
        </Card>
      </Col>
    </Row>
  );
}

function ExplanationCard({ text, mode }: { text: string; mode: Mode }) {
  return (
    <Alert
      type={mode === "cash" ? "success" : "info"}
      showIcon
      message={<strong>What just happened ({mode === "cash" ? "Cash" : "Accrual"} mode)</strong>}
      description={<Text style={{ fontSize: 13 }}>{text}</Text>}
      style={{ marginBottom: 12 }}
    />
  );
}

// ---------- Actions ----------

type ActionKey =
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

function ActionsPanel() {
  const { snapshot, apply } = useLedger();
  const [openKey, setOpenKey] = useState<ActionKey | null>(null);

  const forward: Array<{ key: ActionKey; label: string }> = [
    { key: "send_invoice", label: "Send invoice" },
    { key: "record_payment", label: "Record payment" },
    { key: "take_deposit", label: "Take deposit" },
    { key: "complete_work", label: "Mark work complete" },
    { key: "record_expense", label: "Record expense" },
  ];
  const reverse: Array<{ key: ActionKey; label: string; tip?: string; disabled?: boolean }> = [
    { key: "cancel_invoice", label: "Cancel unpaid invoice" },
    { key: "credit_memo", label: "Issue credit memo" },
    { key: "refund_payment", label: "Refund a payment" },
    { key: "forfeit_deposit", label: "Forfeit a deposit" },
    { key: "write_off", label: "Write off bad debt" },
    { key: "discount", label: "Apply post-send discount" },
    { key: "void", label: "Void invoice (no payments)" },
  ];

  return (
    <Card size="small" title="Actions">
      <Text strong style={{ fontSize: 12, color: "#52c41a" }}>
        MONEY IN / FORWARD
      </Text>
      <Space wrap style={{ marginTop: 6, marginBottom: 12 }}>
        {forward.map((a) => (
          <Button key={a.key} size="small" onClick={() => setOpenKey(a.key)}>
            {a.label}
          </Button>
        ))}
      </Space>
      <br />
      <Text strong style={{ fontSize: 12, color: "#fa8c16" }}>
        REVERSE / MONEY BACK
      </Text>
      <Space wrap style={{ marginTop: 6 }}>
        {reverse.map((a) => (
          <Button key={a.key} size="small" onClick={() => setOpenKey(a.key)}>
            {a.label}
          </Button>
        ))}
      </Space>
      <br />
      <Text strong style={{ fontSize: 12, color: "#722ed1", marginTop: 12, display: "block" }}>
        SPECIAL
      </Text>
      <Space wrap style={{ marginTop: 6 }}>
        <Tooltip title="Receive cash now for a multi-month contract. Try in both modes to see the difference.">
          <Button size="small" onClick={() => setOpenKey("prepaid")}>
            Receive prepaid contract
          </Button>
        </Tooltip>
        <Tooltip title="Move one month of deferred revenue into earned (accrual only).">
          <Button size="small" onClick={() => setOpenKey("recognize")}>
            Recognize 1 month of deferred
          </Button>
        </Tooltip>
      </Space>

      <ActionModal openKey={openKey} onClose={() => setOpenKey(null)} apply={apply} snapshot={snapshot} />
    </Card>
  );
}

function ActionModal({
  openKey,
  onClose,
  apply,
  snapshot,
}: {
  openKey: ActionKey | null;
  onClose: () => void;
  apply: ReturnType<typeof useLedger>["apply"];
  snapshot: ReturnType<typeof useLedger>["snapshot"];
}) {
  const [form] = Form.useForm();
  const title = TITLES[openKey ?? "send_invoice"];

  const submit = async () => {
    try {
      const values = await form.validateFields();
      runAction(openKey!, values, apply, snapshot);
      form.resetFields();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not perform action";
      if ((err as { errorFields?: unknown })?.errorFields) return; // form validation error
      Modal.error({ title: "Couldn't post that entry", content: msg });
    }
  };

  return (
    <Modal
      title={title}
      open={openKey !== null}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={submit}
      okText="Post"
      destroyOnHidden
    >
      {openKey && <ActionForm form={form} actionKey={openKey} snapshot={snapshot} />}
    </Modal>
  );
}

const TITLES: Record<ActionKey, string> = {
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

function ActionForm({
  form,
  actionKey,
  snapshot,
}: {
  form: ReturnType<typeof Form.useForm>[0];
  actionKey: ActionKey;
  snapshot: ReturnType<typeof useLedger>["snapshot"];
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
        <>
          <Form.Item label="Customer" name="customer" rules={[{ required: true }]} initialValue="Acme Co.">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={500}>
            <InputNumber min={0.01} step={50} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );
    case "record_payment":
      return (
        <>
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
        </>
      );
    case "take_deposit":
      return (
        <>
          <Form.Item label="Customer" name="customer" rules={[{ required: true }]} initialValue="Beta LLC">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={300}>
            <InputNumber min={0.01} step={50} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );
    case "complete_work":
      return (
        <Form.Item label="Held deposit" name="depositId" rules={[{ required: true }]}>
          <Select
            placeholder="Pick a held deposit"
            options={heldDeposits.map((d) => ({
              value: d.id,
              label: `${d.customer} — ${fmt(d.amount)} (${d.modeWhenTaken})`,
            }))}
          />
        </Form.Item>
      );
    case "record_expense":
      return (
        <>
          <Form.Item label="Category" name="category" rules={[{ required: true }]} initialValue="Office supplies">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={100}>
            <InputNumber min={0.01} step={10} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );
    case "cancel_invoice":
    case "void":
      return (
        <Form.Item label="Invoice" name="invoiceId" rules={[{ required: true }]}>
          <Select
            placeholder="Pick an unpaid invoice"
            options={cancellableInvoices.map((i) => ({
              value: i.id,
              label: `${i.customer} — ${fmt(i.amount)}`,
            }))}
          />
        </Form.Item>
      );
    case "credit_memo":
    case "discount":
    case "write_off":
      return (
        <>
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
        </>
      );
    case "refund_payment":
      return (
        <>
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
        </>
      );
    case "forfeit_deposit":
      return (
        <Form.Item label="Held deposit" name="depositId" rules={[{ required: true }]}>
          <Select
            placeholder="Pick a held deposit"
            options={heldDeposits.map((d) => ({
              value: d.id,
              label: `${d.customer} — ${fmt(d.amount)}`,
            }))}
          />
        </Form.Item>
      );
    case "prepaid":
      return (
        <>
          <Form.Item label="Customer" name="customer" rules={[{ required: true }]} initialValue="Yearly Client">
            <Input />
          </Form.Item>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={6000}>
            <InputNumber min={1} step={1000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Contract months" name="months" rules={[{ required: true }]} initialValue={6}>
            <InputNumber min={1} max={36} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );
    case "recognize":
      return (
        <>
          <Form.Item label="Amount ($)" name="amount" rules={[{ required: true }]} initialValue={1000}>
            <InputNumber min={0.01} step={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Month label" name="monthLabel" rules={[{ required: true }]} initialValue="Next month">
            <Input />
          </Form.Item>
        </>
      );
  }
}

function runAction(
  key: ActionKey,
  v: Record<string, unknown>,
  apply: ReturnType<typeof useLedger>["apply"],
  _snap: ReturnType<typeof useLedger>["snapshot"],
) {
  const num = (k: string) => Number(v[k]);
  const str = (k: string) => String(v[k]);
  switch (key) {
    case "send_invoice":
      return apply((s) => A.sendInvoice(s, { amount: num("amount"), customer: str("customer") }));
    case "record_payment":
      return apply((s) =>
        A.recordPayment(s, { invoiceId: str("invoiceId"), amount: num("amount") }),
      );
    case "take_deposit":
      return apply((s) => A.takeDeposit(s, { amount: num("amount"), customer: str("customer") }));
    case "complete_work":
      return apply((s) => A.completeWork(s, { depositId: str("depositId") }));
    case "record_expense":
      return apply((s) =>
        A.recordExpense(s, { amount: num("amount"), category: str("category") }),
      );
    case "cancel_invoice":
      return apply((s) => A.cancelUnpaidInvoice(s, { invoiceId: str("invoiceId") }));
    case "void":
      return apply((s) => A.voidInvoice(s, { invoiceId: str("invoiceId") }));
    case "credit_memo":
      return apply((s) =>
        A.issueCreditMemo(s, { invoiceId: str("invoiceId"), amount: num("amount") }),
      );
    case "refund_payment":
      return apply((s) =>
        A.refundPayment(s, { paymentId: str("paymentId"), amount: num("amount") }),
      );
    case "forfeit_deposit":
      return apply((s) => A.forfeitDeposit(s, { depositId: str("depositId") }));
    case "write_off":
      return apply((s) => A.writeOffBadDebt(s, { invoiceId: str("invoiceId") }));
    case "discount":
      return apply((s) =>
        A.applyDiscount(s, { invoiceId: str("invoiceId"), amount: num("amount") }),
      );
    case "prepaid":
      return apply((s) =>
        A.receivePrepaidContract(s, {
          amount: num("amount"),
          customer: str("customer"),
          months: num("months"),
        }),
      );
    case "recognize":
      return apply((s) =>
        A.recognizeDeferred(s, { amount: num("amount"), monthLabel: str("monthLabel") }),
      );
  }
}

// ---------- Journal ----------

function JournalPanel() {
  const { state } = useLedger();
  const data = useMemo(() => [...state.entries].reverse(), [state.entries]);
  return (
    <Card size="small" title={`Journal (${state.entries.length})`}>
      {data.length === 0 ? (
        <Text type="secondary">No entries yet. Try an action or run a preset scenario below.</Text>
      ) : (
        <Table<JournalEntry>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={data}
          scroll={{ x: true }}
          expandable={{
            expandedRowRender: (e) => <JournalLines entry={e} />,
            defaultExpandAllRows: false,
          }}
          columns={[
            {
              title: "Date",
              dataIndex: "date",
              render: (d: string) => new Date(d).toLocaleDateString(),
              width: 100,
            },
            {
              title: "Description",
              dataIndex: "description",
              render: (text: string, e) => (
                <>
                  <div>{text}</div>
                  <Tag color={e.mode === "cash" ? "green" : "blue"} style={{ marginTop: 4 }}>
                    {e.mode}
                  </Tag>
                  {e.informational && (
                    <Tag color="default" style={{ marginTop: 4 }}>
                      no posting
                    </Tag>
                  )}
                </>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}

function JournalLines({ entry }: { entry: JournalEntry }) {
  if (entry.informational || entry.lines.length === 0) {
    return <Text type="secondary">{entry.plainEnglish}</Text>;
  }
  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
  return (
    <div>
      <Paragraph style={{ marginBottom: 8, fontSize: 13 }}>{entry.plainEnglish}</Paragraph>
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <th style={{ textAlign: "left" }}>Account</th>
            <th style={{ textAlign: "right" }}>Debit</th>
            <th style={{ textAlign: "right" }}>Credit</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((l, i) => {
            const acc = accountByCode(l.accountCode);
            return (
              <tr key={i}>
                <td>
                  {acc.code} · {acc.name}
                </td>
                <td style={{ textAlign: "right", color: l.debit > 0 ? "#000" : "#bbb" }}>
                  {l.debit > 0 ? fmt(l.debit) : "—"}
                </td>
                <td style={{ textAlign: "right", color: l.credit > 0 ? "#000" : "#bbb" }}>
                  {l.credit > 0 ? fmt(l.credit) : "—"}
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: "1px solid #eee", fontWeight: 600 }}>
            <td>Totals</td>
            <td style={{ textAlign: "right" }}>{fmt(totalDebit)}</td>
            <td style={{ textAlign: "right" }}>{fmt(totalCredit)}</td>
          </tr>
        </tbody>
      </table>
      <Tag color="green" style={{ marginTop: 8 }}>
        Debits = Credits ✓
      </Tag>
    </div>
  );
}

// ---------- Reports ----------

function ReportsPanel() {
  const { state } = useLedger();
  const pl = useMemo(() => profitAndLoss(state.entries), [state.entries]);
  const bs = useMemo(() => balanceSheet(state.entries), [state.entries]);
  const tb = useMemo(() => trialBalance(state.entries), [state.entries]);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card size="small" title="Chart of Accounts (live balances)">
        <Table
          size="small"
          pagination={false}
          rowKey={(r) => r.account.code}
          dataSource={ACCOUNTS.map((a) => ({ account: a, bal: balanceFor(a.code, state.entries) }))}
          columns={[
            { title: "Code", dataIndex: ["account", "code"], width: 60 },
            {
              title: "Account",
              render: (_, r) => (
                <>
                  <div>{r.account.name}</div>
                  <Tag color={TYPE_COLOR[r.account.type]}>{r.account.type}</Tag>
                </>
              ),
            },
            {
              title: "Balance",
              align: "right" as const,
              render: (_, r) => <Text strong>{fmt(r.bal)}</Text>,
            },
          ]}
        />
      </Card>

      <Card size="small" title="Profit & Loss">
        <Row gutter={8}>
          <Col span={12}>
            <Statistic title="Net revenue" value={pl.netRevenue} prefix="$" precision={2} />
          </Col>
          <Col span={12}>
            <Statistic title="Expenses" value={pl.expenses} prefix="$" precision={2} />
          </Col>
        </Row>
        <Statistic
          title="Net income"
          value={pl.netIncome}
          prefix="$"
          precision={2}
          valueStyle={{ color: pl.netIncome >= 0 ? "#3f8600" : "#cf1322" }}
          style={{ marginTop: 8 }}
        />
      </Card>

      <Card size="small" title="Balance Sheet">
        <Row gutter={8}>
          <Col span={12}>
            <Statistic title="Total assets" value={bs.totalAssets} prefix="$" precision={2} />
          </Col>
          <Col span={12}>
            <Statistic
              title="Liab. + equity"
              value={bs.totalLiabilitiesAndEquity}
              prefix="$"
              precision={2}
            />
          </Col>
        </Row>
        <Tag color={bs.balanced ? "green" : "red"} style={{ marginTop: 8 }}>
          {bs.balanced ? "Assets = Liab. + Equity ✓" : "Out of balance"}
        </Tag>
      </Card>

      <Card size="small" title="Trial Balance">
        <Table
          size="small"
          pagination={false}
          rowKey={(r) => r.account.code}
          dataSource={tb.rows.filter((r) => r.debit > 0 || r.credit > 0)}
          columns={[
            { title: "Account", render: (_, r) => `${r.account.code} · ${r.account.name}` },
            {
              title: "Debit",
              align: "right" as const,
              render: (_, r) => (r.debit > 0 ? fmt(r.debit) : "—"),
            },
            {
              title: "Credit",
              align: "right" as const,
              render: (_, r) => (r.credit > 0 ? fmt(r.credit) : "—"),
            },
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong>{fmt(tb.totalDebit)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <strong>{fmt(tb.totalCredit)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
        <Tag color={tb.balanced ? "green" : "red"} style={{ marginTop: 8 }}>
          {tb.balanced ? "Balanced ✓" : "OUT OF BALANCE"}
        </Tag>
      </Card>
    </Space>
  );
}

const TYPE_COLOR: Record<string, string> = {
  asset: "blue",
  liability: "orange",
  equity: "purple",
  income: "green",
  expense: "red",
};

// ---------- Scenarios ----------

function ScenariosPanel() {
  const { setMode, apply, reset, state } = useLedger();
  const [activeId, setActiveId] = useState<string>(SCENARIOS[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const scenario = SCENARIOS.find((s) => s.id === activeId)!;

  const startScenario = (sc: Scenario) => {
    reset();
    if (sc.forceMode) setMode(sc.forceMode);
    setActiveId(sc.id);
    setStepIndex(0);
  };

  const playStep = () => {
    const step = scenario.steps[stepIndex];
    if (!step) return;
    try {
      apply(step.apply);
      setStepIndex((i) => i + 1);
    } catch (e) {
      Modal.error({
        title: "Step failed",
        content: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const playAll = () => {
    let i = stepIndex;
    const runNext = () => {
      if (i >= scenario.steps.length) return;
      try {
        apply(scenario.steps[i].apply);
        i += 1;
        setStepIndex(i);
        setTimeout(runNext, 350);
      } catch (e) {
        Modal.error({
          title: "Step failed",
          content: e instanceof Error ? e.message : "Unknown error",
        });
      }
    };
    runNext();
  };

  return (
    <Card size="small" title="Preset scenarios (guided lessons)">
      <Space wrap style={{ marginBottom: 12 }}>
        {SCENARIOS.map((sc) => (
          <Button
            key={sc.id}
            size="small"
            type={sc.id === activeId ? "primary" : "default"}
            onClick={() => startScenario(sc)}
          >
            {sc.title}
          </Button>
        ))}
      </Space>
      <Paragraph style={{ fontSize: 13, marginBottom: 8 }}>{scenario.blurb}</Paragraph>
      <Steps
        size="small"
        direction="vertical"
        current={stepIndex}
        items={scenario.steps.map((s) => ({ title: s.label }))}
      />
      <Space style={{ marginTop: 12 }}>
        <Button
          type="primary"
          size="small"
          onClick={playStep}
          disabled={stepIndex >= scenario.steps.length}
        >
          {stepIndex >= scenario.steps.length
            ? "All steps played"
            : `Play step ${stepIndex + 1} / ${scenario.steps.length}`}
        </Button>
        <Button
          size="small"
          onClick={playAll}
          disabled={stepIndex >= scenario.steps.length}
        >
          Play all remaining
        </Button>
        <Button size="small" onClick={() => startScenario(scenario)}>
          Reset & restart
        </Button>
      </Space>
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Current mode: <strong>{state.mode}</strong>
          {scenario.forceMode && scenario.forceMode !== state.mode
            ? ` (this scenario reads best in ${scenario.forceMode})`
            : ""}
        </Text>
      </div>
    </Card>
  );
}

// ---------- Monthly revenue (the cash-vs-accrual spike vs smooth visual) ----------

function MonthlyRevenuePanel() {
  const { state } = useLedger();
  const data = useMemo(() => monthlyRevenue(state.entries), [state.entries]);
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <Card size="small" title="Revenue by month (the lesson surface)">
      {data.length === 0 ? (
        <Text type="secondary">
          No revenue yet. Run scenario (e) in Cash then in Accrual to see the spike vs. smooth
          contrast.
        </Text>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          {data.map((d) => (
            <div key={d.month}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>{d.month}</span>
                <strong>{fmt(d.amount)}</strong>
              </div>
              <Progress
                percent={Math.round((d.amount / max) * 100)}
                showInfo={false}
                strokeColor={state.mode === "cash" ? "#52c41a" : "#1677ff"}
              />
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
}
