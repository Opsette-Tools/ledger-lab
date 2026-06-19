import { useMemo, useState } from "react";
import { App as AntApp, Button, Card, Tag, Typography } from "antd";
import { CheckCircleFilled, RedoOutlined } from "@ant-design/icons";
import {
  BASICS_ACCOUNTS,
  HOME_SIDE_INFO,
  TYPE_LABEL,
  type BasicsAccount,
  type HomeSide,
} from "../../lib/accounting/basics";
import { ACCRUAL_BLUE, CASH_GREEN } from "./format";

const { Paragraph, Text, Title } = Typography;

/**
 * Interaction #1 — the home-side sort. The learner picks an account, then taps
 * the side they think makes it go UP (Debit-home or Credit-home). Right → it
 * snaps into that zone with a check and reveals the one-line meaning. Wrong →
 * a gentle nudge + a one-line hint; the card stays in the pile.
 *
 * Teaches the single rule the whole system hangs on, BY FEEL — no walls of text.
 */
export function HomeSideSort() {
  const { message } = AntApp.useApp();
  // A stable shuffle so the pile order doesn't reshuffle on every render.
  const order = useMemo(() => shuffledIndexes(BASICS_ACCOUNTS.length), []);
  const [placed, setPlaced] = useState<Record<number, HomeSide>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);

  const placedCount = Object.keys(placed).length;
  const allDone = placedCount === BASICS_ACCOUNTS.length;

  const pile = order.filter((i) => placed[i] === undefined);

  const tryPlace = (side: HomeSide) => {
    if (selected === null) {
      message.info("Pick an account from the pile first, then choose its side.");
      return;
    }
    const acct = BASICS_ACCOUNTS[selected];
    if (acct.homeSide === side) {
      setPlaced((p) => ({ ...p, [selected]: side }));
      setSelected(null);
    } else {
      // Gentle nudge — keep the card in the pile, give a one-line "why".
      setWrongFlash(selected);
      window.setTimeout(() => setWrongFlash(null), 600);
      message.warning(hintFor(acct), 3);
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
        Step 1 — Which side does each account go <em>up</em> on?
      </Title>
      <Paragraph style={{ fontSize: 13, marginBottom: 6 }}>
        Think of your business as two sides.{" "}
        <strong style={{ color: CASH_GREEN }}>Left</strong> is what value went <em>toward</em> — things
        you hold, and what it cost to keep them.{" "}
        <strong style={{ color: ACCRUAL_BLUE }}>Right</strong> is where the value <em>came from</em> —
        income, what you owe, and what you put in. Tap an account, read what it is, then place it on
        the side it <em>grows</em> on.
      </Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
        You're only learning which way each account goes <strong>up</strong> right now — its “home”
        side. (An account can later move the <em>other</em> way when it goes <strong>down</strong> —
        that's the next step. So you're not locking these in forever; you're learning where each one
        grows.)
      </Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 11.5, marginBottom: 16 }}>
        (Accountants call the Left side “debit” and the Right side “credit” — you can forget those
        words for now. The positions are what matter.)
      </Paragraph>

      {/* The pile of unplaced accounts */}
      {!allDone && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Accounts to sort ({pile.length} left)
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {pile.map((i) => {
              const acct = BASICS_ACCOUNTS[i];
              const isSel = selected === i;
              const isWrong = wrongFlash === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(isSel ? null : i)}
                  style={{
                    cursor: "pointer",
                    border: `1.5px solid ${isSel ? "#2f4f46" : "#d9d9d9"}`,
                    background: isSel ? "#eef3f1" : "#fff",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "transform 0.1s, border-color 0.15s",
                    transform: isWrong ? "translateX(0)" : undefined,
                    animation: isWrong ? "ll-shake 0.4s" : undefined,
                  }}
                >
                  {acct.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected-account detail — shown BEFORE placement so the learner can
          reason about the side from what the account actually is, instead of
          guessing. This is the teaching, not a reward for guessing right. */}
      {selected !== null && (
        <div
          style={{
            border: "1px solid #d6e4ff",
            background: "#f0f5ff",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Text strong style={{ fontSize: 14 }}>
              {BASICS_ACCOUNTS[selected].name}
            </Text>
            <Tag color={BASICS_ACCOUNTS[selected].contra ? "gold" : "default"} style={{ margin: 0 }}>
              {TYPE_LABEL[BASICS_ACCOUNTS[selected].type]}
              {BASICS_ACCOUNTS[selected].contra ? " (contra)" : ""}
            </Tag>
          </div>
          <Paragraph style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
            {BASICS_ACCOUNTS[selected].meaning}
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.5, margin: "6px 0 0" }}>
            <Text strong style={{ fontSize: 12.5 }}>
              When you'd use it:
            </Text>{" "}
            {BASICS_ACCOUNTS[selected].whenToUse}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8, fontStyle: "italic" }}>
            Now: is this something value went <em>toward</em> (Left), or where value <em>came from</em>{" "}
            (Right)? Tap the side it grows on.
          </Text>
        </div>
      )}

      {/* The two home-side zones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <HomeZone
          side="debit"
          accent={CASH_GREEN}
          accounts={placedAccounts(placed, "debit")}
          onPlace={() => tryPlace("debit")}
          armed={selected !== null}
        />
        <HomeZone
          side="credit"
          accent={ACCRUAL_BLUE}
          accounts={placedAccounts(placed, "credit")}
          onPlace={() => tryPlace("credit")}
          armed={selected !== null}
        />
      </div>

      {/* The reveal — only once everything's sorted */}
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
            That's the whole rule.
          </Text>
          <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: "4px 0 0" }}>
            <strong>Assets and Expenses</strong> go <em>up</em> on the{" "}
            <strong style={{ color: CASH_GREEN }}>Left</strong> — things you hold and what it cost to
            keep them.{" "}
            <strong>Income, Liabilities, and Equity</strong> go <em>up</em> on the{" "}
            <strong style={{ color: ACCRUAL_BLUE }}>Right</strong> — where the value came from. Every
            entry puts equal weight on both sides, so the Left always equals the Right.
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 13, margin: "8px 0 0" }}>
            Notice <strong>Sales Discounts</strong> broke the pattern — it's income, but it sat on
            the <strong>Left</strong>. That's a “contra” account: its job is to <em>reduce</em>
            income, so it lives on the opposite side. The one exception that proves the rule.
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 12, margin: "10px 0 0", fontStyle: "italic" }}>
            (When you're ready: the Left is what accountants call “debit,” the Right is “credit.”
            Same positions — just the old names.)
          </Paragraph>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Button size="small" icon={<RedoOutlined />} onClick={reset} disabled={placedCount === 0}>
          Start over
        </Button>
      </div>

      {/* Local keyframes for the wrong-answer nudge. */}
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

function HomeZone({
  side,
  accent,
  accounts,
  onPlace,
  armed,
}: {
  side: HomeSide;
  accent: string;
  accounts: BasicsAccount[];
  onPlace: () => void;
  armed: boolean;
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
        minHeight: 140,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
        <Text strong style={{ color: accent, fontSize: 15 }}>
          {info.label}
        </Text>
        <Text style={{ color: accent, fontSize: 12, opacity: 0.85 }}>— {info.blurb}</Text>
      </div>
      <Text strong style={{ fontSize: 12.5, display: "block" }}>
        {info.types}
      </Text>
      <Text type="secondary" style={{ fontSize: 11.5, display: "block", marginBottom: 8 }}>
        {info.rule}
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {accounts.map((a) => (
          <div
            key={a.name}
            style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 6,
              padding: "6px 8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircleFilled style={{ color: accent, fontSize: 13 }} />
              <Text style={{ fontSize: 12.5, fontWeight: 600 }}>{a.name}</Text>
              <Tag
                style={{ marginLeft: "auto", marginRight: 0, fontSize: 10, lineHeight: "16px", padding: "0 5px" }}
                color={a.contra ? "gold" : undefined}
              >
                {TYPE_LABEL[a.type]}
                {a.contra ? " (contra)" : ""}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 11.5, display: "block", marginTop: 3 }}>
              {a.meaning}
            </Text>
          </div>
        ))}
      </div>
    </button>
  );
}

function placedAccounts(placed: Record<number, HomeSide>, side: HomeSide): BasicsAccount[] {
  return Object.entries(placed)
    .filter(([, s]) => s === side)
    .map(([i]) => BASICS_ACCOUNTS[Number(i)]);
}

function hintFor(acct: BasicsAccount): string {
  const correctSide = acct.homeSide === "debit" ? "Left" : "Right";
  if (acct.contra) {
    return `Tricky one: ${acct.name} is income, but it's a “contra” account — its job is to reduce income, so it sits on the ${correctSide}.`;
  }
  const family =
    acct.type === "asset" || acct.type === "expense"
      ? "Assets and Expenses (things you hold + what it costs to keep them)"
      : "Income, Liabilities, and Equity (where the money came from)";
  return `Not quite — ${acct.name} is ${TYPE_LABEL[acct.type].toLowerCase()}. ${family} live on the ${correctSide}.`;
}

function shuffledIndexes(n: number): number[] {
  // Deterministic-enough shuffle without Date/Math.random ordering concerns:
  // a fixed interleave that scatters types so it isn't pre-sorted by side.
  const idx = Array.from({ length: n }, (_, i) => i);
  const out: number[] = [];
  let lo = 0;
  let hi = n - 1;
  while (lo <= hi) {
    out.push(idx[hi]);
    if (lo !== hi) out.push(idx[lo]);
    lo += 1;
    hi -= 1;
  }
  return out;
}
