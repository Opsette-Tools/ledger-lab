import { useMemo } from "react";
import { Card, Empty, Table, Tag, Typography } from "antd";
import { useLedger } from "../../state/ledgerStore";
import { accountByCode, type JournalEntry } from "../../lib/accounting/engine";
import { fmt } from "./format";

const { Paragraph, Text } = Typography;

/**
 * The running journal — every entry, newest first, expandable to reveal the
 * debit/credit lines and the plain-English narration. The expand row is where
 * the "debits always equal credits" lesson lives.
 */
export function JournalPanel() {
  const { state } = useLedger();
  const data = useMemo(() => [...state.entries].reverse(), [state.entries]);

  return (
    <Card size="small" title={`Journal (${state.entries.length} ${state.entries.length === 1 ? "entry" : "entries"})`}>
      {data.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">
              No entries yet. Record an action above, or run a guided lesson on the Learn tab.
            </Text>
          }
        />
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
