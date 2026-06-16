import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LedgerProvider } from "../state/ledgerStore";
import Sandbox from "../components/sandbox/Sandbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Double-Entry Accounting Sandbox — Cash vs. Accrual" },
      {
        name: "description",
        content:
          "An interactive teaching tool: record real small-business transactions and watch the books update live in both Cash and Accrual mode.",
      },
      { property: "og:title", content: "Double-Entry Accounting Sandbox" },
      {
        property: "og:description",
        content:
          "Cash vs. Accrual, explained by doing. Send invoices, take deposits, issue credits, watch every debit and credit balance in real time.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // Antd is heavy and uses CSS-in-JS; render client-only to avoid SSR style/hydration noise.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Lazy-register PWA service worker (guarded inside the wrapper).
    void import("../pwa/registerSW").then((m) => m.registerSW());
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f6f8",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: "#666",
        }}
      >
        Loading accounting sandbox…
      </div>
    );
  }

  return (
    <LedgerProvider>
      <Sandbox />
    </LedgerProvider>
  );
}
