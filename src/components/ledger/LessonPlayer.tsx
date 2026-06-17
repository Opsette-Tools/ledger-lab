import { useState } from "react";
import { App as AntApp, Button, Card, Segmented, Space, Tag, Typography } from "antd";
import {
  ArrowRightOutlined,
  BulbOutlined,
  CaretRightOutlined,
  CheckCircleFilled,
  FastForwardOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { useLedger } from "../../state/ledgerStore";
import { LESSONS, type Lesson } from "../../lib/accounting/lessons";
import { ACCRUAL_BLUE, CASH_GREEN } from "./format";

const { Paragraph, Text, Title } = Typography;

/**
 * The guided-lesson surface. Delivers each lesson's teaching content inline:
 *
 *   intro question  →  step (button + narration shown the instant it runs)  →  takeaway
 *
 * The narration appears RIGHT HERE with the lesson — not in a separate banner
 * across the page — so cause (the click) and explanation (what it did) sit
 * together. The method (Cash/Accrual) is read live and never auto-switched.
 */
export function LessonPlayer() {
  const { apply, applySequence, reset, state } = useLedger();
  const { modal } = AntApp.useApp();
  const [activeId, setActiveId] = useState<string>(LESSONS[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  // Narration is the engine's REAL, mode-correct explanation of each step that
  // actually ran — never a hardcoded script. This is what keeps the text honest
  // when the user runs a lesson in cash vs. accrual.
  const [narrations, setNarrations] = useState<string[]>([]);
  const lesson = LESSONS.find((l) => l.id === activeId)!;
  const done = stepIndex >= lesson.steps.length;
  const accent = state.mode === "cash" ? CASH_GREEN : ACCRUAL_BLUE;
  const methodName = state.mode === "cash" ? "Cash" : "Accrual";
  const otherMethod = state.mode === "cash" ? "Accrual" : "Cash";

  // Picking a lesson (or replaying it) resets the books and clears narration,
  // but NEVER changes the method — the toggle is the user's alone.
  const startLesson = (l: Lesson) => {
    reset();
    setActiveId(l.id);
    setStepIndex(0);
    setNarrations([]);
  };

  const playStep = () => {
    const step = lesson.steps[stepIndex];
    if (!step) return;
    try {
      const explanation = apply(step.apply);
      setNarrations((n) => [...n, explanation]);
      setStepIndex((i) => i + 1);
    } catch (e) {
      modal.error({ title: "Couldn't run that step", content: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  const playAll = () => {
    const remaining = lesson.steps.slice(stepIndex).map((s) => s.apply);
    if (remaining.length === 0) return;
    try {
      const explanations = applySequence(remaining);
      setNarrations((n) => [...n, ...explanations]);
      setStepIndex(stepIndex + explanations.length);
    } catch (e) {
      modal.error({ title: "Couldn't run that step", content: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  const nextStep = done ? null : lesson.steps[stepIndex];
  const isMultiStep = lesson.steps.length > 1;

  return (
    <Card size="small" styles={{ body: { padding: 0 } }}>
      {/* Lesson picker */}
      <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
        <Segmented
          block
          value={activeId}
          onChange={(v) => startLesson(LESSONS.find((l) => l.id === v)!)}
          options={LESSONS.map((l) => ({ label: l.shortLabel, value: l.id }))}
        />
      </div>

      <div style={{ padding: 16 }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
          {lesson.title}
        </Title>

        {/* Intro question — always visible, sets up the lesson */}
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          {lesson.intro}
        </Paragraph>

        {/* Progress + which method we're running in */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Tag color={state.mode === "cash" ? "green" : "blue"} style={{ margin: 0 }}>
            Running in {state.mode === "cash" ? "Cash" : "Accrual"}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Step {Math.min(stepIndex + (done ? 0 : 1), lesson.steps.length)} of {lesson.steps.length}
          </Text>
        </div>

        {/* Narration of each step that actually ran — the engine's TRUE,
            mode-correct explanation, so the text never contradicts the method
            you're in. One block per completed step. */}
        {narrations.map((text, i) => (
          <div
            key={i}
            style={{
              borderLeft: `4px solid ${accent}`,
              background: state.mode === "cash" ? "#f6ffed" : "#e6f4ff",
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <CheckCircleFilled style={{ color: accent, marginTop: 3 }} />
              <Text style={{ fontSize: 13.5, lineHeight: 1.55 }}>{text}</Text>
            </div>
          </div>
        ))}

        {/* The takeaway — only when the lesson is complete */}
        {done && (
          <div
            style={{
              border: "1px solid #ffe58f",
              background: "#fffbe6",
              borderRadius: 8,
              padding: "12px 14px",
              margin: "4px 0 16px",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <BulbOutlined style={{ color: "#d48806", marginTop: 3, fontSize: 16 }} />
              <div>
                <Text strong style={{ fontSize: 13 }}>
                  What you just learned
                </Text>
                {/* Lead with the method the user is actually in; frame the other
                    as the contrast. So in Cash you read the cash point first,
                    then "Accrual, on the other hand…" — never "in accrual… in
                    cash it's the opposite" while standing on the cash tab. */}
                <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: "4px 0 0" }}>
                  <Text strong>{methodName}:</Text>{" "}
                  {state.mode === "cash" ? lesson.takeaway.cash : lesson.takeaway.accrual}
                </Paragraph>
                <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: "6px 0 0" }}>
                  <Text strong>{otherMethod}, on the other hand:</Text>{" "}
                  {state.mode === "cash" ? lesson.takeaway.accrual : lesson.takeaway.cash}
                </Paragraph>
                {lesson.takeaway.shared && (
                  <Paragraph style={{ fontSize: 13.5, lineHeight: 1.55, margin: "6px 0 0" }}>
                    {lesson.takeaway.shared}
                  </Paragraph>
                )}
                {/* Dynamic cross-mode nudge — derived from the CURRENT method so
                    it never tells you to "flip to" the mode you're already in. */}
                <Paragraph style={{ fontSize: 13, lineHeight: 1.5, margin: "10px 0 0", color: "#8c6d1f" }}>
                  You just ran this in <strong>{methodName}</strong>. Flip the toggle to{" "}
                  <strong>{otherMethod}</strong> and run it again — watch what changes (and what
                  doesn't).
                </Paragraph>
              </div>
            </div>
          </div>
        )}

        {/* Controls — the primary button is the NEXT real-world action, named */}
        <Space wrap>
          {nextStep ? (
            <Button
              type="primary"
              icon={stepIndex === 0 ? <CaretRightOutlined /> : <ArrowRightOutlined />}
              onClick={playStep}
            >
              {nextStep.label}
            </Button>
          ) : (
            <Button type="primary" icon={<RedoOutlined />} onClick={() => startLesson(lesson)}>
              Run it again
            </Button>
          )}

          {isMultiStep && !done && (
            <Button icon={<FastForwardOutlined />} onClick={playAll}>
              Play all {lesson.steps.length} steps
            </Button>
          )}

          {stepIndex > 0 && !done && (
            <Button icon={<RedoOutlined />} onClick={() => startLesson(lesson)}>
              Restart
            </Button>
          )}
        </Space>

        {/* Method tip — suggestion only, never auto-switches */}
        {lesson.suggestedMode && lesson.suggestedMode !== state.mode && (
          <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            Tip: this lesson is most interesting in <strong>{lesson.suggestedMode}</strong> mode —
            flip the toggle at the top if you want to see that version. Nothing switches on its own.
          </Paragraph>
        )}
      </div>
    </Card>
  );
}
