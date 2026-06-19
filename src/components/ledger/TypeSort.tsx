import { useState } from "react";
import { App as AntApp, Button, Card, Typography } from "antd";
import { CheckCircleFilled, RedoOutlined } from "@ant-design/icons";
import {
  HOME_SIDE_INFO,
  TYPE_CARDS,
  TYPE_LABEL,
  type HomeSide,
  type TypeCard,
} from "../../lib/accounting/basics";
import { ACCRUAL_BLUE, CASH_GREEN } from "./format";

const { Paragraph, Text, Title } = Typography;

/**
 * Step 0 — the foundation. Sort the FIVE account TYPES (not the 11 accounts)
 * into Left / Right. Once these five are locked, every account inherits its side
 * from its type — the cheat that makes Step 1 reasoning instead of memorizing.
 *
 * Kept deliberately clean: no contra exception here, just a light asterisk on
 * Income noting one exists. Same tap-then-place mechanic as Step 1 for
 * consistency.
 */
export function TypeSort() {
  const { message } = AntApp.useApp();
  const [placed, setPlaced] = useState<Record<string, HomeSide>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

  const allDone = Object.keys(placed).length === TYPE_CARDS.length;
  const pile = TYPE_CARDS.filter((t) => placed[t.type] === undefined);
  const selectedCard = TYPE_CARDS.find((t) => t.type === selected) ?? null;

  const tryPlace = (side: HomeSide) => {
    if (!selectedCard) {
      message.info("Pick a type first, then choose its side.");
      return;
    }
    if (selectedCard.homeSide === side) {
      setPlaced((p) => ({ ...p, [selectedCard.type]: side }));
      setSelected(null);
    } else {
      setWrongFlash(selectedCard.type);
      window.setTimeout(() => setWrongFlash(null), 600);
      message.warning(hintFor(selectedCard), 3);
    }
  };

  const reset = () => {
    setPlaced({});
    setSelected(null);
    setWrongFlash(null);
  };

  return (
    <Card size="small" styles={{ body: { padding: 16 } }}>
      <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
        Step 0 — Start with the five types
      </Title>
      <Paragraph style={{ fontSize: 13, marginBottom: 6 }}>
        Before the accounts, lock in the five <em>families</em> every account belongs to. Each family
        has a home side, and once you know these five, every account inherits its side from its type
        — that's the shortcut.{" "}
        <strong style={{ color: CASH_GREEN }}>Left</strong> = what value went toward;{" "}
        <strong style={{ color: ACCRUAL_BLUE }}>Right</strong> = where value came from.
      </Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 11.5, marginBottom: 16 }}>
        (Accountants call the Left “debit” and the Right “credit” — forget those for now; the
        positions are what matter.)
      </Paragraph>

      {/* Pile of unplaced types */}
      {!allDone && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Types to sort ({pile.length} left)
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {pile.map((t) => {
              const isSel = selected === t.type;
              const isWrong = wrongFlash === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setSelected(isSel ? null : t.type)}
                  style={{
                    cursor: "pointer",
                    border: `1.5px solid ${isSel ? "#2f4f46" : "#d9d9d9"}`,
                    background: isSel ? "#eef3f1" : "#fff",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    animation: isWrong ? "ll-shake 0.4s" : undefined,
                  }}
                >
                  {TYPE_LABEL[t.type]}
                  {t.note ? <span style={{ color: "#d48806" }}> *</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected type detail — read before placing, so you reason it out */}
      {selectedCard && (
        <div
          style={{
            border: "1px solid #d6e4ff",
            background: "#f0f5ff",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
          }}
        >
          <Text strong style={{ fontSize: 14 }}>
            {TYPE_LABEL[selectedCard.type]}
          </Text>
          <Paragraph style={{ fontSize: 13.5, lineHeight: 1.5, margin: "4px 0 0" }}>
            {selectedCard.meaning}
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.5, margin: "4px 0 0" }}>
            <Text strong style={{ fontSize: 12.5 }}>
              For example:
            </Text>{" "}
            {selectedCard.example}
          </Paragraph>
          {selectedCard.note && (
            <Paragraph style={{ fontSize: 12, lineHeight: 1.45, margin: "6px 0 0", color: "#d48806" }}>
              * {selectedCard.note}
            </Paragraph>
          )}
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8, fontStyle: "italic" }}>
            Now: is this something value went <em>toward</em> (Left), or where value <em>came from</em>{" "}
            (Right)?
          </Text>
        </div>
      )}

      {/* The two zones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Zone side="debit" accent={CASH_GREEN} placed={placedTypes(placed, "debit")} armed={!!selectedCard} onPlace={() => tryPlace("debit")} />
        <Zone side="credit" accent={ACCRUAL_BLUE} placed={placedTypes(placed, "credit")} armed={!!selectedCard} onPlace={() => tryPlace("credit")} />
      </div>

      {/* The reveal once all five are sorted */}
      {allDone && (
        <div
          style={{
            border: "1px solid #ffe58f",
            background: "#fffbe6",
            borderRadius: 8,
            padding: "12px 14px",
            marginTop: 16,
          }}
        >
          <Text strong style={{ fontSize: 13 }}>
            That's the foundation.
          </Text>
          <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: "4px 0 0" }}>
            <strong>Assets and Expenses</strong> live on the{" "}
            <strong style={{ color: CASH_GREEN }}>Left</strong>.{" "}
            <strong>Liabilities, Equity, and Income</strong> live on the{" "}
            <strong style={{ color: ACCRUAL_BLUE }}>Right</strong>. Every account belongs to one of
            these five families, so from here you can read an account's side straight off its type.
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 12.5, margin: "8px 0 0" }}>
            (* Income has one rule-breaker — a “contra” account that sits on the Left. You'll meet it
            in Step 1.)
          </Paragraph>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Button size="small" icon={<RedoOutlined />} onClick={reset} disabled={Object.keys(placed).length === 0}>
          Start over
        </Button>
      </div>

      <style>{`
        @keyframes ll-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </Card>
  );
}

function Zone({
  side,
  accent,
  placed,
  armed,
  onPlace,
}: {
  side: HomeSide;
  accent: string;
  placed: TypeCard[];
  armed: boolean;
  onPlace: () => void;
}) {
  const info = HOME_SIDE_INFO[side];
  return (
    <button
      type="button"
      onClick={onPlace}
      style={{
        textAlign: "left",
        cursor: armed ? "pointer" : "default",
        border: `2px ${armed ? "dashed" : "solid"} ${armed ? accent : "#e8e8e8"}`,
        background: armed ? `${accent}0d` : "#fafafa",
        borderRadius: 10,
        padding: 12,
        minHeight: 130,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
        <Text strong style={{ color: accent, fontSize: 15 }}>
          {info.label}
        </Text>
        <Text style={{ color: accent, fontSize: 12, opacity: 0.85 }}>— {info.blurb}</Text>
      </div>
      <Text type="secondary" style={{ fontSize: 11.5, display: "block", marginBottom: 8 }}>
        {info.rule}
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {placed.map((t) => (
          <div
            key={t.type}
            style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 6,
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircleFilled style={{ color: accent, fontSize: 13 }} />
            <Text strong style={{ fontSize: 12.5 }}>
              {TYPE_LABEL[t.type]}
            </Text>
            {t.note && <Text style={{ color: "#d48806", fontSize: 12 }}>*</Text>}
          </div>
        ))}
      </div>
    </button>
  );
}

function placedTypes(placed: Record<string, HomeSide>, side: HomeSide): TypeCard[] {
  return TYPE_CARDS.filter((t) => placed[t.type] === side);
}

function hintFor(card: TypeCard): string {
  const correct = card.homeSide === "debit" ? "Left" : "Right";
  const why =
    card.homeSide === "debit"
      ? "things you hold or what it cost to keep them go on the Left"
      : "where the money came from goes on the Right";
  return `Not quite — ${TYPE_LABEL[card.type]} belongs on the ${correct}: ${why}.`;
}
