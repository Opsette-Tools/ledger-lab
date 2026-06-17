import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
  mode: "cash",
  entries: [],
  invoices: [],
  deposits: [],
  payments: [],
  lastExplanation:
    "Record an event below and this will explain, in plain English, exactly what it did to the books.",
};

type Action =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "APPLY"; result: ActionResult }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: State };

/** Build the snapshot the action handlers read from, off the live state. */
function snapshotOf(state: State): LedgerSnapshot {
  return {
    mode: state.mode,
    entries: state.entries,
    invoices: state.invoices,
    deposits: state.deposits,
    payments: state.payments,
  };
}

/** Fold a result into the running state. Pure — no handler execution here. */
function applyResult(state: State, result: ActionResult): State {
  return {
    ...state,
    entries: [...state.entries, ...result.newEntries],
    invoices: result.invoices,
    deposits: result.deposits,
    payments: result.payments,
    lastExplanation: result.explanation,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "APPLY":
      return applyResult(state, action.result);
    case "RESET":
      return { ...INITIAL, mode: state.mode };
    case "HYDRATE":
      return action.state;
  }
}

// Bumped to v2: v1 could persist an old default method (accrual) and resurrect
// it on load, overriding the cash default. v2 starts clean.
const STORAGE_KEY = "ledger_lab_state_v2";

interface LedgerContextValue {
  state: State;
  snapshot: LedgerSnapshot;
  setMode: (mode: Mode) => void;
  /** Applies an action and returns its mode-correct plain-English explanation. */
  apply: (fn: (snap: LedgerSnapshot) => ActionResult) => string;
  /** Applies a sequence and returns each step's explanation, in order. */
  applySequence: (fns: Array<(snap: LedgerSnapshot) => ActionResult>) => string[];
  reset: () => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Always-current mirror of state. Lets apply() validate a step against the
  // latest books synchronously (so a guard can throw to the caller's catch),
  // while still chaining correctly during a rapid "Play all" sequence.
  const stateRef = useRef(state);
  stateRef.current = state;

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

  // Returns the engine's mode-correct plain-English explanation of what this
  // action actually did, so callers (lessons) can show the TRUE narration for
  // the current method instead of a hardcoded script.
  const apply = useCallback((fn: (snap: LedgerSnapshot) => ActionResult) => {
    const result = fn(snapshotOf(stateRef.current));
    dispatch({ type: "APPLY", result });
    return result.explanation;
  }, []);

  // Run several steps as one logical lesson. Each step folds against the
  // previous step's result locally (not against async React state), so the
  // chain never reads stale books — the bug behind "invoice/deposit not found"
  // when playing a multi-step lesson. Returns the per-step explanations (in
  // order) so the caller can narrate exactly what happened in the current mode.
  const applySequence = useCallback(
    (fns: Array<(snap: LedgerSnapshot) => ActionResult>) => {
      let working = snapshotOf(stateRef.current);
      const explanations: string[] = [];
      for (const fn of fns) {
        const result = fn(working);
        dispatch({ type: "APPLY", result });
        explanations.push(result.explanation);
        working = {
          mode: working.mode,
          entries: [...working.entries, ...result.newEntries],
          invoices: result.invoices,
          deposits: result.deposits,
          payments: result.payments,
        };
      }
      return explanations;
    },
    [],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const value = useMemo<LedgerContextValue>(
    () => ({ state, snapshot, setMode, apply, applySequence, reset }),
    [state, snapshot, setMode, apply, applySequence, reset],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside <LedgerProvider>");
  return ctx;
}
