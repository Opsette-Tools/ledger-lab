import { useMemo } from "react";
import { Card, Col, Row, Statistic, Table, Tabs, Tag, Typography } from "antd";
import { useLedger } from "../../state/ledgerStore";
import {
  ACCOUNTS,
  balanceFor,
  balanceSheet,
  profitAndLoss,
  trialBalance,
} from "../../lib/accounting/engine";
import { fmt } from "./format";

const { Text } = Typography;

const TYPE_COLOR: Record<string, string> = {
  asset: "blue",
  liability: "orange",
  equity: "purple",
  income: "green",
  expense: "red",
};

/**
 * The four financial reports, tabbed instead of stacked. Previously these ran
 * down the page in one tall column and pushed everything else below the fold;
 * tabs keep each report a single click away without the scroll.
 */
export function ReportsTabs() {
  return (
    <Card size="small" title="Financial reports">
      <Tabs
        size="small"
        defaultActiveKey="coa"
        items={[
          { key: "coa", label: "Chart of Accounts", children: <ChartOfAccounts /> },
          { key: "pl", label: "Profit & Loss", children: <ProfitLoss /> },
          { key: "bs", label: "Balance Sheet", children: <BalanceSheetReport /> },
          { key: "tb", label: "Trial Balance", children: <TrialBalanceReport /> },
        ]}
      />
    </Card>
  );
}

function ChartOfAccounts() {
  const { state } = useLedger();
  return (
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
  );
}

function ProfitLoss() {
  const { state } = useLedger();
  const pl = useMemo(() => profitAndLoss(state.entries), [state.entries]);
  return (
    <>
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
        style={{ marginTop: 12 }}
      />
    </>
  );
}

function BalanceSheetReport() {
  const { state } = useLedger();
  const bs = useMemo(() => balanceSheet(state.entries), [state.entries]);
  return (
    <>
      <Row gutter={8}>
        <Col span={12}>
          <Statistic title="Total assets" value={bs.totalAssets} prefix="$" precision={2} />
        </Col>
        <Col span={12}>
          <Statistic
            title="Liabilities + equity"
            value={bs.totalLiabilitiesAndEquity}
            prefix="$"
            precision={2}
          />
        </Col>
      </Row>
      <Tag color={bs.balanced ? "green" : "red"} style={{ marginTop: 12 }}>
        {bs.balanced ? "Assets = Liabilities + Equity ✓" : "Out of balance"}
      </Tag>
    </>
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
    </>
  );
}
