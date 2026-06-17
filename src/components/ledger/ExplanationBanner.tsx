import { Alert, Typography } from "antd";
import type { Mode } from "../../lib/accounting/engine";

const { Text } = Typography;

/**
 * The running "here's what your last action did to the books, in plain English"
 * banner. This is the heart of the teaching loop — it narrates every entry.
 */
export function ExplanationBanner({ text, mode }: { text: string; mode: Mode }) {
  return (
    <Alert
      type={mode === "cash" ? "success" : "info"}
      showIcon
      message={<strong>What just happened ({mode === "cash" ? "Cash" : "Accrual"} mode)</strong>}
      description={<Text style={{ fontSize: 13 }}>{text}</Text>}
    />
  );
}
