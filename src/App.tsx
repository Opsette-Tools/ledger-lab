import { useMemo, useState } from "react";
import { Alert, App as AntdApp, ConfigProvider, Segmented, Space, Typography } from "antd";
import { OpsetteHeader } from "./components/opsette-header";
import { OpsetteFooterLogo } from "./components/opsette-share";
import { LedgerProvider, useLedger } from "./state/ledgerStore";
import { ModeBar } from "./components/ledger/ModeBar";
import { ExplanationBanner } from "./components/ledger/ExplanationBanner";
import { LearnView } from "./components/ledger/LearnView";
import { ExploreView } from "./components/ledger/ExploreView";
import { trialBalance } from "./lib/accounting/engine";

const { Paragraph } = Typography;

type Tab = "learn" | "explore";

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2f4f46",
          fontFamily: '"Inter", system-ui, sans-serif',
          borderRadius: 10,
        },
      }}
    >
      <AntdApp>
        <LedgerProvider>
          <div style={{ minHeight: "100dvh", background: "#fafafa" }}>
            <OpsetteHeader />
            <LedgerWorkspace />
          </div>
        </LedgerProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

const WELCOME_DISMISSED_KEY = "ledger_lab_welcome_dismissed";

function LedgerWorkspace() {
  const { state, setMode, reset } = useLedger();
  const [tab, setTab] = useState<Tab>("learn");
  const [showWelcome, setShowWelcome] = useState(
    () => typeof window === "undefined" || window.localStorage.getItem(WELCOME_DISMISSED_KEY) !== "1",
  );
  const tb = useMemo(() => trialBalance(state.entries), [state.entries]);

  const dismissWelcome = () => {
    setShowWelcome(false);
    try {
      window.localStorage.setItem(WELCOME_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "16px" }}>
      {showWelcome && (
        <Alert
          type="info"
          showIcon
          closable
          onClose={dismissWelcome}
          style={{ marginBottom: 16 }}
          message="Welcome to Ledger Lab"
          description="Start on the Learn tab and play a guided lesson. Each step asks a question, then tells you in plain English exactly what it did to the books — and why cash and accrual sometimes disagree. Switch to Explore when you want to record events yourself."
        />
      )}

      <Segmented
        block
        size="large"
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { label: "Learn — guided lessons", value: "learn" },
          { label: "Explore — drive the books", value: "explore" },
        ]}
        style={{ marginBottom: 16 }}
      />

      <ModeBar mode={state.mode} onMode={setMode} balanced={tb.balanced} onReset={reset} />

      {tab === "learn" ? (
        // On Learn, each lesson narrates itself inline — no top banner needed.
        <LearnView />
      ) : (
        // On Explore, the user fires raw actions, so the running "what just
        // happened" banner is the narration of their last move.
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <ExplanationBanner text={state.lastExplanation} mode={state.mode} />
          <ExploreView />
        </Space>
      )}

      <Paragraph
        type="secondary"
        style={{ textAlign: "center", fontSize: 12, marginTop: 32 }}
      >
        A teaching sandbox — everything lives in your browser, nothing is uploaded.
      </Paragraph>

      <OpsetteFooterLogo />
    </main>
  );
}
