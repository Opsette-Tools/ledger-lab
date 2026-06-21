import { useMemo, useState } from "react";
import { Alert, App as AntdApp, ConfigProvider, Segmented, Typography } from "antd";
import { OpsetteHeader } from "./components/opsette-header";
import { OpsetteFooterLogo } from "./components/opsette-share";
import { LedgerProvider, useLedger } from "./state/ledgerStore";
import { ModeBar } from "./components/ledger/ModeBar";
import { BasicsView } from "./components/ledger/BasicsView";
import { LearnView } from "./components/ledger/LearnView";
import { ExploreView } from "./components/ledger/ExploreView";
import { trialBalance } from "./lib/accounting/engine";

const { Paragraph } = Typography;

type Tab = "basics" | "learn" | "explore";

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
  const [tab, setTab] = useState<Tab>("basics");
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
          description="New to this? Start on Basics — sort the accounts and feel the one rule the whole system runs on. Then Learn walks you through real situations step by step, and Explore lets you drive the books yourself."
        />
      )}

      <Segmented
        block
        size="large"
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { label: "Basics — the accounts", value: "basics" },
          { label: "Learn — guided lessons", value: "learn" },
          { label: "Explore — drive the books", value: "explore" },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* The Cash/Accrual method bar is only meaningful once you're recording
          transactions. Basics is about the accounts themselves, so it's hidden
          there to avoid implying the sort depends on the method. */}
      {tab !== "basics" && (
        <ModeBar mode={state.mode} onMode={setMode} balanced={tb.balanced} onReset={reset} />
      )}

      {tab === "basics" ? (
        <BasicsView />
      ) : tab === "learn" ? (
        // On Learn, each lesson narrates itself inline — no top banner needed.
        <LearnView />
      ) : (
        // On Explore, the "what just happened" narration lives inside the
        // Journal panel (under its header), tied to the entry it describes —
        // not as a detached banner up here that reads like ignorable instructions.
        <ExploreView />
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
