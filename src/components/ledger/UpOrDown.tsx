import { useState } from "react";
import { Button, Card, Segmented, Tag, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import {
  BASICS_ACCOUNTS,
  HOME_SIDE_INFO,
  TYPE_LABEL,
  landingSide,
  type BasicsAccount,
  type Direction,
  type HomeSide,
} from "../../lib/accounting/basics";
import { ACCRUAL_BLUE, CASH_GREEN } from "./format";

const { Paragraph, Text, Title } = Typography;

/**
 * Step 2 — "What goes down?" The learner picks an account, then chooses whether
 * it's going UP or DOWN, and a balance bar visibly moves so they SEE it. The
 * point: an account grows on its home side, but it SHRINKS on the opposite side.
 * So Accounts Receivable (home = Left) shows up on the RIGHT when it goes down —
 * which is the "why did AR jump ship?" moment, felt rather than explained.
 */
export function UpOrDown() {
  const [acctIndex, setAcctIndex] = useState(0);
  const [direction, setDirection] = useState<Direction | null>(null);
  const acct = BASICS_ACCOUNTS[acctIndex];

  // Which side does this movement land on? (shared rule from basics.ts)
  const side: HomeSide | null = direction === null ? null : landingSide(acct, direction);

  const pick = (i: number) => {
    setAcctIndex(i);
    setDirection(null);
  };

  return (
    <Card size="small" styles={{ body: { padding: 16 } }}>
      <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
        Step 2 — Same account can land on <em>either</em> side
      </Title>
      <Paragraph style={{ fontSize: 13, marginBottom: 6 }}>
        In Step 1 you learned each account's <strong>home</strong> side — the side it grows on. Here's
        the twist: an account <em>shrinks</em> on the <strong>opposite</strong> side. Pick an account,
        then say whether it's going up or down, and watch where it lands.
      </Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        Goes <strong>up</strong> → lands on its home side. Goes <strong>down</strong> → lands on the
        other side. That's the whole trick to “why is this account on the side I didn't expect?”
      </Paragraph>

      {/* Account picker */}
      <Text strong style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.4 }}>
        Pick an account
      </Text>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px" }}>
        {BASICS_ACCOUNTS.map((a, i) => (
          <button
            key={a.name}
            type="button"
            onClick={() => pick(i)}
            style={{
              cursor: "pointer",
              border: `1.5px solid ${i === acctIndex ? "#2f4f46" : "#d9d9d9"}`,
              background: i === acctIndex ? "#eef3f1" : "#fff",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* The chosen account + its definition + home side reminder */}
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
            {acct.name}
          </Text>
          <Tag color={acct.contra ? "gold" : "default"} style={{ margin: 0 }}>
            {TYPE_LABEL[acct.type]}
            {acct.contra ? " (contra)" : ""}
          </Tag>
          <Tag style={{ margin: 0 }} color={acct.homeSide === "debit" ? "green" : "blue"}>
            Home: {HOME_SIDE_INFO[acct.homeSide].label}
          </Tag>
        </div>
        <Paragraph style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{acct.meaning}</Paragraph>

        <div style={{ marginTop: 12 }}>
          <Text strong style={{ fontSize: 12.5 }}>
            Is it going up or down?
          </Text>
          <div style={{ marginTop: 6 }}>
            <Segmented
              value={direction ?? ""}
              onChange={(v) => setDirection(v as Direction)}
              options={[
                { label: "Goes UP ▲", value: "up" },
                { label: "Goes DOWN ▼", value: "down" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* The visual result — a two-pan balance showing which side the movement lands on */}
      <Balance acct={acct} side={side} direction={direction} />

      {/* The "aha" callout once a direction is chosen */}
      {direction && side && (
        <div
          style={{
            border: `1px solid ${side === "debit" ? "#b7eb8f" : "#91caff"}`,
            background: side === "debit" ? "#f6ffed" : "#e6f4ff",
            borderRadius: 8,
            padding: "12px 14px",
            marginTop: 16,
          }}
        >
          <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
            {acct.name} is going <strong>{direction}</strong>, so it lands on the{" "}
            <strong style={{ color: side === "debit" ? CASH_GREEN : ACCRUAL_BLUE }}>
              {HOME_SIDE_INFO[side].label}
            </strong>
            {direction === "up" ? (
              <> — its home side, the way you sorted it in Step 1.</>
            ) : (
              <>
                {" "}
                — the <em>opposite</em> of its home. It didn't change what it is; it just shrank, and
                shrinking shows up on the other side.
              </>
            )}
          </Paragraph>
          {direction === "down" && acct.name === "Accounts Receivable" && (
            <Paragraph type="secondary" style={{ fontSize: 12.5, lineHeight: 1.5, margin: "8px 0 0" }}>
              This is the one that trips everyone up: a customer pays what they owed, so Accounts
              Receivable goes <strong>down</strong> — and there it is on the Right, even though its
              home is the Left.
            </Paragraph>
          )}
        </div>
      )}
    </Card>
  );
}

function Balance({
  acct,
  side,
  direction,
}: {
  acct: BasicsAccount;
  side: HomeSide | null;
  direction: Direction | null;
}) {
  const onLeft = side === "debit";
  const onRight = side === "credit";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Pan
        label={HOME_SIDE_INFO.debit.label}
        sub={HOME_SIDE_INFO.debit.blurb}
        accent={CASH_GREEN}
        active={onLeft}
        acct={onLeft ? acct : null}
        direction={direction}
      />
      <Pan
        label={HOME_SIDE_INFO.credit.label}
        sub={HOME_SIDE_INFO.credit.blurb}
        accent={ACCRUAL_BLUE}
        active={onRight}
        acct={onRight ? acct : null}
        direction={direction}
      />
    </div>
  );
}

function Pan({
  label,
  sub,
  accent,
  active,
  acct,
  direction,
}: {
  label: string;
  sub: string;
  accent: string;
  active: boolean;
  acct: BasicsAccount | null;
  direction: Direction | null;
}) {
  return (
    <div
      style={{
        border: `2px solid ${active ? accent : "#e8e8e8"}`,
        background: active ? `${accent}0d` : "#fafafa",
        borderRadius: 10,
        padding: 12,
        minHeight: 120,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <Text strong style={{ color: accent, fontSize: 15 }}>
        {label}
      </Text>
      <Text style={{ color: accent, fontSize: 12, opacity: 0.85, display: "block", marginBottom: 10 }}>
        {sub}
      </Text>

      {active && acct ? (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${accent}`,
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {direction === "up" ? (
              <ArrowUpOutlined style={{ color: accent }} />
            ) : (
              <ArrowDownOutlined style={{ color: "#cf1322" }} />
            )}
            <Text strong style={{ fontSize: 13 }}>
              {acct.name}
            </Text>
            <Text style={{ marginLeft: "auto", fontSize: 12, color: direction === "up" ? accent : "#cf1322" }}>
              {direction === "up" ? "going up" : "going down"}
            </Text>
          </div>
        </div>
      ) : (
        <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
          —
        </Text>
      )}
    </div>
  );
}

