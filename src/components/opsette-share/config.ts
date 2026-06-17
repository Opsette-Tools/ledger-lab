export type OpsetteShareConfig = {
  appName: string;
  tagline: string;
  url: string;
  logoSrc?: string;
};

export const opsetteShareConfig: OpsetteShareConfig = {
  appName: "Ledger Lab",
  tagline:
    "Learn double-entry accounting by doing — record real business events and watch the books update live in Cash vs. Accrual.",
  url: "https://tools.opsette.io/ledger-lab/",
  logoSrc: "opsette-logo.png",
};
