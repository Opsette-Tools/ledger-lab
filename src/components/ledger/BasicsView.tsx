import { useState } from "react";
import { Segmented, Space } from "antd";
import { TypeSort } from "./TypeSort";
import { HomeSideSort } from "./HomeSideSort";
import { UpOrDown } from "./UpOrDown";
import { Counterbalance } from "./Counterbalance";

/**
 * The Accounting Basics surface — a guided progression of "learn by feel"
 * interactions, each one rung at a time:
 *
 *   Step 0 — The five account types and their side    (type sort) ← foundation
 *   Step 1 — Which side does each account go UP on?    (home-side sort)
 *   Step 2 — Same account can land on either side      (up or down)
 *   Step 3 — Build a real event so it balances         (the counterbalance)
 *
 * Kept as its own sub-stepper so the top-level tabs stay simple (Basics / Learn
 * / Explore) while Basics itself walks you through the foundation in order.
 */
type Step = "types" | "grows" | "updown" | "balance";

export function BasicsView() {
  const [step, setStep] = useState<Step>("types");

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Segmented
        block
        value={step}
        onChange={(v) => setStep(v as Step)}
        options={[
          { label: "Step 0 — The five types", value: "types" },
          { label: "Step 1 — Which side it grows on", value: "grows" },
          { label: "Step 2 — Up or down", value: "updown" },
          { label: "Step 3 — Build a balanced entry", value: "balance" },
        ]}
      />
      {step === "types" ? (
        <TypeSort />
      ) : step === "grows" ? (
        <HomeSideSort />
      ) : step === "updown" ? (
        <UpOrDown />
      ) : (
        <Counterbalance />
      )}
    </Space>
  );
}
