import { useMemo } from "react";
import { Card, Empty, Progress, Space, Typography } from "antd";
import { useLedger } from "../../state/ledgerStore";
import { monthlyRevenue } from "../../lib/accounting/engine";
import { ACCRUAL_BLUE, CASH_GREEN, fmt } from "./format";

const { Text } = Typography;

/**
 * Revenue-by-month bars — the punchline of the whole tool. Run the prepaid
 * contract scenario in Cash (one giant spike) then Accrual (smooth monthly)
 * and the two pictures tell the entire story at a glance.
 */
export function RevenueChart() {
  const { state } = useLedger();
  const data = useMemo(() => monthlyRevenue(state.entries), [state.entries]);
  const max = Math.max(1, ...data.map((d) => d.amount));
  const color = state.mode === "cash" ? CASH_GREEN : ACCRUAL_BLUE;

  return (
    <Card
      size="small"
      title="Revenue by month"
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          {state.mode === "cash" ? "Cash" : "Accrual"} view
        </Text>
      }
    >
      {data.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary" style={{ fontSize: 13 }}>
              No revenue yet. Run the <strong>Prepaid contract</strong> lesson in Cash, then again
              in Accrual, and watch this chart change shape.
            </Text>
          }
        />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size={10}>
          {data.map((d) => (
            <div key={d.month}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>{d.month}</span>
                <strong>{fmt(d.amount)}</strong>
              </div>
              <Progress
                percent={Math.round((d.amount / max) * 100)}
                showInfo={false}
                strokeColor={color}
              />
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
}
