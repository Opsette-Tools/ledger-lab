import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Deposit, Invoice, JournalEntry, Mode, Payment } from "../lib/accounting/engine";
import type { ActionResult, LedgerSnapshot } from "../lib/accounting/actions";

interface State {
  mode: Mode;
  entries: JournalEntry[];
  invoices: Invoice[];
  deposits: Deposit[];
  payments: Payment[];
  lastExplanation: string;
}

const INITIAL: State = {
  mode: "accrual",
  entries: [],
  invoices: [],
  deposits: [],
  payments: [],
  lastExplanation:
    "Welcome — pick an action on the left, or try a preset scenario at the bottom to watch a complete story unfold.",
};

type Action =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "APPLY"; result: ActionResult }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: State };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "APPLY":
      return {
        ...state,
        entries: [...state.entries, ...action.result.newEntries],
        invoices: action.result.invoices,
        deposits: action.result.deposits,
        payments: action.result.payments,
        lastExplanation: action.result.explanation,
      };
    case "RESET":
      return { ...INITIAL, mode: state.mode };
    case "HYDRATE":
      return action.state;
  }
}

const STORAGE_KEY = "accounting_sandbox_v1";

interface LedgerContextValue {
  state: State;
  snapshot: LedgerSnapshot;
  setMode: (mode: Mode) => void;
  apply: (fn: (snap: LedgerSnapshot) => ActionResult) => void;
  reset: () => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate from localStorage once on mount (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed && Array.isArray(parsed.entries)) {
          dispatch({ type: "HYDRATE", state: parsed });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const snapshot = useMemo<LedgerSnapshot>(
    () => ({
      mode: state.mode,
      entries: state.entries,
      invoices: state.invoices,
      deposits: state.deposits,
      payments: state.payments,
    }),
    [state],
  );

  const setMode = useCallback((mode: Mode) => dispatch({ type: "SET_MODE", mode }), []);
  const apply = useCallback(
    (fn: (snap: LedgerSnapshot) => ActionResult) => {
      const snap: LedgerSnapshot = {
        mode: state.mode,
        entries: state.entries,
        invoices: state.invoices,
        deposits: state.deposits,
        payments: state.payments,
      };
      const result = fn(snap);
      dispatch({ type: "APPLY", result });
    },
    [state],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const value = useMemo<LedgerContextValue>(
    () => ({ state, snapshot, setMode, apply, reset }),
    [state, snapshot, setMode, apply, reset],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside <LedgerProvider>");
  return ctx;
}
