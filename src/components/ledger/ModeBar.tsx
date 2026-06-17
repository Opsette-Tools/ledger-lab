import { Button, Segmented, Space, Tag, Tooltip, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { Mode } from "../../lib/accounting/engine";

const { Text } = Typography;

/**
 * The persistent control strip: the Cash/Accrual switch (the single most
 * important toggle in the whole tool), the live "are the books balanced?"
 * indicator, and a reset. Shared by both the Learn and Explore views so the
 * mode follows you between them.
 */
export function ModeBar({
  mode,
  onMode,
  balanced,
  onReset,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  balanced: boolean;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <Space size={8} align="center">
        <Text strong style={{ fontSize: 13, color: "#555" }}>
          Accounting method
        </Text>
        <Segmented
          value={mode}
          onChange={(v) => onMode(v as Mode)}
          options={[
            { label: "Cash", value: "cash" },
            { label: "Accrual", value: "accrual" },
          ]}
        />
      </Space>

      <div style={{ flex: 1 }} />

      <Tooltip title="Every journal entry must have debits equal to credits. If this ever says out of balance, the books are broken.">
        <Tag color={balanced ? "green" : "red"} style={{ margin: 0, fontWeight: 600 }}>
          {balanced ? "Books balanced ✓" : "OUT OF BALANCE"}
        </Tag>
      </Tooltip>
      <Button size="small" icon={<ReloadOutlined />} onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
