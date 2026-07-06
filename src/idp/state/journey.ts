import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getJourney, type Journey } from "../api/homepage";

/**
 * Journey state (spec Connection 6). A "journey" is a cross-persona workflow of
 * 3 steps. The active journey + current step live in localStorage["idp_journey"]
 * so the journey banner (rendered in the shell) and the sidebar progress
 * indicator persist across route changes and refreshes.
 */

const JOURNEY_KEY = "idp_journey";

interface JourneyState {
  journey_id: string;
  current_step: number; // 0-based
}

interface JourneyContextType {
  /** the active journey definition, or undefined when none is running */
  journey: Journey | undefined;
  /** 0-based index of the current step */
  step: number;
  /** begin a journey at step 0 (returns the step-1 url to navigate to) */
  start: (journeyId: string) => string | undefined;
  /** advance to the next step (returns the url to navigate to, or undefined at the end) */
  next: () => string | undefined;
  /** clear the active journey */
  exit: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

const read = (): JourneyState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    const parsed = raw ? (JSON.parse(raw) as JourneyState) : null;
    if (parsed && typeof parsed.journey_id === "string" && getJourney(parsed.journey_id)) {
      return parsed;
    }
  } catch {
    /* ignore malformed state */
  }
  return null;
};

export const JourneyProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<JourneyState | null>(() => read());

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state) localStorage.setItem(JOURNEY_KEY, JSON.stringify(state));
    else localStorage.removeItem(JOURNEY_KEY);
  }, [state]);

  const start = useCallback((journeyId: string) => {
    const j = getJourney(journeyId);
    if (!j) return undefined;
    setState({ journey_id: journeyId, current_step: 0 });
    return j.steps[0]?.url;
  }, []);

  const next = useCallback(() => {
    let url: string | undefined;
    setState((s) => {
      if (!s) return s;
      const j = getJourney(s.journey_id);
      if (!j) return null;
      const ns = s.current_step + 1;
      if (ns >= j.steps.length) {
        url = undefined;
        return { ...s, current_step: j.steps.length - 1 }; // clamp at last (banner shows "complete")
      }
      url = j.steps[ns]?.url;
      return { ...s, current_step: ns };
    });
    return url;
  }, []);

  const exit = useCallback(() => setState(null), []);

  const journey = state ? getJourney(state.journey_id) : undefined;
  const step = state?.current_step ?? 0;

  return createElement(
    JourneyContext.Provider,
    { value: { journey, step, start, next, exit } },
    children
  );
};

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (ctx === undefined) {
    throw new Error("useJourney must be used within a JourneyProvider");
  }
  return ctx;
}
