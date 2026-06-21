import { useMemo } from "react";
import { Card, Col, Empty, Row, Table, Tag, Typography } from "antd";
import { useLedger } from "../../state/ledgerStore";
import {
  ACCOUNTS,
  balanceFor,
  balanceSheet,
  profitAndLoss,
  trialBalance,
  type Account,
} from "../../lib/accounting/engine";
import { fmt } from "./format";

const { Text, Title } = Typography;

const TYPE_COLOR: Record<string, string> = {
  asset: "blue",
  liability: "orange",
  equity: "purple",
  income: "green",
  expense: "red",
};

/** Map each engine account type to the Left/Right side the learner now knows. */
const SIDE_OF: Record<string, "Left" | "Right"> = {
  asset: "Left",
  expense: "Left",
  liability: "Right",
  equity: "Right",
  income: "Right",
};

/**
 * The financial reports — full-width, with the Chart of Accounts as the live
 * anchor (watch balances move as you post) and the three statements (P&L,
 * Balance Sheet, Trial Balance) as supporting summary cards beside it. Each
 * carries a one-line "what it's for" so the learner knows why it exists.
 */
export function ReportsPanel() {
  const { state } = useLedger();
  const hasEntries = state.entries.length > 0;

  return (
    <Card
      size="small"
      title="Financial reports"
      styles={{ header: { background: "#eef3f1", color: "#2f4f46" } }}
    >
      {!hasEntries ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">
              Nothing recorded yet. Record an event above and watch these update — the Chart of
              Accounts shows every account's running balance, and the three statements roll those up.
            </Text>
          }
        />
      ) : (
        // Short, fixed-height SUMMARIES on top (they only ever show a few
        // lines); the GROWING detail tables underneath, where their length is
        // expected. Keeps the top tidy and the growth at the bottom.
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ReportBlock
              title="Profit & Loss"
              subtitle="What you earned vs. what you spent — your income statement."
            >
              <ProfitLoss />
            </ReportBlock>
          </Col>
          <Col xs={24} lg={12}>
            <ReportBlock
              title="Balance Sheet"
              subtitle="What you own vs. what you owe + put in — Left must equal Right."
            >
              <BalanceSheetReport />
            </ReportBlock>
          </Col>
          <Col xs={24} lg={12}>
            <ReportBlock
              title="Chart of Accounts"
              subtitle="Every account and what it's holding right now — your live balances. Watch these move as you post."
            >
              <ChartOfAccounts />
            </ReportBlock>
          </Col>
          <Col xs={24} lg={12}>
            <ReportBlock
              title="Trial Balance"
              subtitle="Every Left total and Right total, side by side — they must match."
            >
              <TrialBalanceReport />
            </ReportBlock>
          </Col>
        </Row>
      )}
    </Card>
  );
}

function ReportBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: "1px solid #f0f0f0", borderRadius: 10, padding: 12 }}>
      <Title level={5} style={{ margin: 0 }}>
        {title}
      </Title>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 10 }}>
        {subtitle}
      </Text>
      {children}
    </div>
  );
}

function ChartOfAccounts() {
  const { state } = useLedger();
  // Only show accounts that have a balance — keeps the table focused on what
  // actually moved, instead of a wall of $0.00 rows.
  const rows = useMemo(
    () =>
      ACCOUNTS.map((a) => ({ account: a, bal: balanceFor(a.code, state.entries) })).filter(
        (r) => r.bal !== 0,
      ),
    [state.entries],
  );

  if (rows.length === 0) {
    return <Text type="secondary">No balances yet.</Text>;
  }

  return (
    <Table
      size="small"
      pagination={false}
      rowKey={(r) => r.account.code}
      dataSource={rows}
      columns={[
        {
          title: "Account",
          render: (_, r: { account: Account; bal: number }) => (
            <>
              <div>{r.account.name}</div>
              <Tag color={TYPE_COLOR[r.account.type]} style={{ marginTop: 2 }}>
                {r.account.type}
              </Tag>
              <Tag style={{ marginTop: 2 }}>{SIDE_OF[r.account.type]}</Tag>
            </>
          ),
        },
        {
          title: "Balance",
          align: "right" as const,
          render: (_, r: { account: Account; bal: number }) => <Text strong>{fmt(r.bal)}</Text>,
        },
      ]}
    />
  );
}

/** Compact label/value row — replaces the oversized AntD Statistic blocks. */
function StatRow({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: number;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "3px 0",
      }}
    >
      <Text type="secondary" style={{ fontSize: 13 }}>
        {label}
      </Text>
      <Text strong={strong} style={{ fontSize: strong ? 15 : 14, color }}>
        {fmt(value)}
      </Text>
    </div>
  );
}

function ProfitLoss() {
  const { state } = useLedger();
  const pl = useMemo(() => profitAndLoss(state.entries), [state.entries]);
  return (
    <div>
      <StatRow label="Net revenue" value={pl.netRevenue} />
      <StatRow label="Expenses" value={pl.expenses} />
      <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 4, paddingTop: 4 }}>
        <StatRow
          label="Net income"
          value={pl.netIncome}
          strong
          color={pl.netIncome >= 0 ? "#3f8600" : "#cf1322"}
        />
      </div>
    </div>
  );
}

function BalanceSheetReport() {
  const { state } = useLedger();
  const bs = useMemo(() => balanceSheet(state.entries), [state.entries]);
  return (
    <div>
      <StatRow label="Total assets (Left)" value={bs.totalAssets} />
      <StatRow label="Liabilities + equity (Right)" value={bs.totalLiabilitiesAndEquity} />
      <Tag color={bs.balanced ? "green" : "red"} style={{ marginTop: 8 }}>
        {bs.balanced ? "Left = Right ✓" : "Out of balance"}
      </Tag>
    </div>
  );
}

function TrialBalanceReport() {
  const { state } = useLedger();
  const tb = useMemo(() => trialBalance(state.entries), [state.entries]);
  return (
    <>
      <Table
        size="small"
        pagination={false}
        rowKey={(r) => r.account.code}
        dataSource={tb.rows.filter((r) => r.debit > 0 || r.credit > 0)}
        columns={[
          { title: "Account", render: (_, r) => `${r.account.name}` },
          {
            title: "Left",
            align: "right" as const,
            render: (_, r) => (r.debit > 0 ? fmt(r.debit) : "—"),
          },
          {
            title: "Right",
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
        {tb.balanced ? "Left = Right ✓" : "OUT OF BALANCE"}
      </Tag>
    </>
  );
}
