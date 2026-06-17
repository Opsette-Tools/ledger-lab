export const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

export const ACCRUAL_BLUE = "#1677ff";
export const CASH_GREEN = "#389e0d";
