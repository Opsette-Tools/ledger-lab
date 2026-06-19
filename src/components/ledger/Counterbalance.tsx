import { useMemo, useState } from "react";
import { Button, Card, Segmented, Tag, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, CheckCircleFilled } from "@ant-design/icons";
import {
  HOME_SIDE_INFO,
  LEDGER_EVENTS,
  TYPE_LABEL,
  accountByName,
  landingSide,
  type Direction,
  type HomeSide,
  type LedgerEvent,
} from "../../lib/accounting/basics";
import { fmt, ACCRUAL_BLUE, CASH_GREEN } from "./format";

const { Paragraph, Text, Title } = Typography;

/**
 * Step 3 — the counterbalance. The payoff: a real EVENT moves TWO accounts, and
 * the learner builds the whole entry. They're told which two accounts are
 * involved (picking from all 11 is a later step); the lesson here is direction
 * and balance. For each account they choose up or down; the tool lands it on
 * the correct side (the Step-2 rule) and checks that the entry balances —
 * exactly one on the Left, one on the Right, equal amounts.
 */
export function Counterbalance() {
  const [eventId, setEventId] = useState<string>(LEDGER_EVENTS[0].id);
  const event = LEDGER_EVENTS.find((e) => e.id === eventId)!;
  // Per-account chosen direction, keyed by account name.
  const [choices, setChoices] = useState<Record<string, Direction>>({});

  const startEvent = (id: string) => {
    setEventId(id);
    setChoices({});
  };

  const setDir = (account: string, dir: Direction) =>
    setChoices((c) => ({ ...c, [account]: dir }));

  // Evaluate the build once both accounts have a direction chosen.
  const result = useMemo(() => evaluate(event, choices), [event, choices]);

  return (
    <Card size="small" styles={{ body: { padding: 16 } }}>
      <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
        Step 3 — Build the entry so it balances
      </Title>
      <Paragraph style={{ fontSize: 13, marginBottom: 6 }}>
        Every real event moves <strong>two</strong> accounts — and a correct entry always has equal
        weight on the Left and the Right. You're told which two accounts are involved; your job is to
        decide which way each one moves. Get the directions right and the scale balances.
      </Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        Remember from Step 2: an account goes <strong>up</strong> on its home side and{" "}
        <strong>down</strong> on the opposite side.
      </Paragraph>

      {/* Event picker */}
      <Segmented
        block
        value={eventId}
        onChange={(v) => startEvent(v as string)}
        options={LEDGER_EVENTS.map((e) => ({ label: e.shortLabel, value: e.id }))}
        style={{ marginBottom: 12 }}
      />

      {/* The event prompt */}
      <div
        style={{
          border: "1px solid #d6e4ff",
          background: "#f0f5ff",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 16,
        }}
      >
        <Text strong style={{ fontSize: 13.5 }}>
          The event
        </Text>
        <Paragraph style={{ fontSize: 13.5, lineHeight: 1.5, margin: "4px 0 0" }}>
          {event.prompt}
        </Paragraph>
      </div>

      {/* Each involved account: choose its direction */}
      <Text strong style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.4 }}>
        Which way does each one move?
      </Text>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "8px 0 16px" }}>
        {event.moves.map((m) => {
          const acct = accountByName(m.account);
          const chosen = choices[m.account] ?? null;
          return (
            <div
              key={m.account}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: "10px 12px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13.5 }}>
                  {acct.name}
                </Text>
                <Tag color={acct.contra ? "gold" : "default"} style={{ margin: 0 }}>
                  {TYPE_LABEL[acct.type]}
                </Tag>
                <Tag style={{ margin: 0 }} color={acct.homeSide === "debit" ? "green" : "blue"}>
                  Home: {HOME_SIDE_INFO[acct.homeSide].label}
                </Tag>
              </div>
              <Segmented
                size="small"
                value={chosen ?? ""}
                onChange={(v) => setDir(m.account, v as Direction)}
                options={[
                  { label: "Goes UP ▲", value: "up" },
                  { label: "Goes DOWN ▼", value: "down" },
                ]}
              />
            </div>
          );
        })}
      </div>

      {/* The scale */}
      <Scale event={event} choices={choices} />

      {/* Verdict */}
      {result.complete && (
        <div
          style={{
            border: `1px solid ${result.balanced ? "#b7eb8f" : "#ffccc7"}`,
            background: result.balanced ? "#f6ffed" : "#fff2f0",
            borderRadius: 8,
            padding: "12px 14px",
            marginTop: 16,
          }}
        >
          {result.balanced ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CheckCircleFilled style={{ color: "#52c41a" }} />
                <Text strong style={{ fontSize: 13.5 }}>
                  Balanced — Left {fmt(event.amount)} = Right {fmt(event.amount)}
                </Text>
              </div>
              <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: "2px 0 0" }}>
                {event.lesson}
              </Paragraph>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {event.moves.map((m) => (
                  <li key={m.account} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    {m.why}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
              Not balanced yet. {result.hint} A correct entry needs <strong>one account on the
              Left and one on the Right</strong> — if both landed on the same side, rethink which way
              each one moves.
            </Paragraph>
          )}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Button size="small" onClick={() => startEvent(eventId)} disabled={Object.keys(choices).length === 0}>
          Clear & retry
        </Button>
      </div>
    </Card>
  );
}

function Scale({ event, choices }: { event: LedgerEvent; choices: Record<string, Direction> }) {
  // Place each chosen account onto its computed landing side.
  const placed = event.moves
    .filter((m) => choices[m.account])
    .map((m) => {
      const acct = accountByName(m.account);
      const dir = choices[m.account];
      return { name: m.account, dir, side: landingSide(acct, dir) };
    });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Pan side="debit" accent={CASH_GREEN} placed={placed.filter((p) => p.side === "debit")} amount={event.amount} />
      <Pan side="credit" accent={ACCRUAL_BLUE} placed={placed.filter((p) => p.side === "credit")} amount={event.amount} />
    </div>
  );
}

function Pan({
  side,
  accent,
  placed,
  amount,
}: {
  side: HomeSide;
  accent: string;
  placed: Array<{ name: string; dir: Direction }>;
  amount: number;
}) {
  const info = HOME_SIDE_INFO[side];
  return (
    <div
      style={{
        border: `2px solid ${placed.length ? accent : "#e8e8e8"}`,
        background: placed.length ? `${accent}0d` : "#fafafa",
        borderRadius: 10,
        padding: 12,
        minHeight: 110,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <Text strong style={{ color: accent, fontSize: 15 }}>
        {info.label}
      </Text>
      <Text style={{ color: accent, fontSize: 12, opacity: 0.85, display: "block", marginBottom: 8 }}>
        {info.blurb}
      </Text>
      {placed.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {placed.map((p) => (
            <div
              key={p.name}
              style={{
                background: "#fff",
                border: `1px solid ${accent}`,
                borderRadius: 8,
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {p.dir === "up" ? (
                <ArrowUpOutlined style={{ color: accent }} />
              ) : (
                <ArrowDownOutlined style={{ color: "#cf1322" }} />
              )}
              <Text strong style={{ fontSize: 12.5 }}>
                {p.name}
              </Text>
              <Text style={{ marginLeft: "auto", fontSize: 12 }}>{fmt(amount)}</Text>
            </div>
          ))}
        </div>
      ) : (
        <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
          —
        </Text>
      )}
    </div>
  );
}

function evaluate(
  event: LedgerEvent,
  choices: Record<string, Direction>,
): { complete: boolean; balanced: boolean; hint: string } {
  const allChosen = event.moves.every((m) => choices[m.account]);
  if (!allChosen) return { complete: false, balanced: false, hint: "" };

  const correct = event.moves.every((m) => choices[m.account] === m.direction);
  if (correct) return { complete: true, balanced: true, hint: "" };

  // Figure out which side each landed on to give a targeted nudge.
  const sides = event.moves.map((m) => landingSide(accountByName(m.account), choices[m.account]));
  const sameSide = sides[0] === sides[1];
  const hint = sameSide
    ? "Both accounts landed on the same side."
    : "The directions don't match this event.";
  return { complete: true, balanced: false, hint };
}
