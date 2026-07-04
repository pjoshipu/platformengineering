import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Per-user IDP preferences, persisted to localStorage. Currently powers:
 *  - left-hand menu customization (which nav paths are hidden, per persona)
 *  - "start with the sidebar collapsed" appearance option
 * Shared via context so the Sidebar (read) and Settings screen (write) stay in
 * sync live. Mounted by IdpApp around the AppShell.
 */

interface PrefsState {
  hiddenByPersona: Record<string, string[]>;
  collapsedDefault: boolean;
}

const KEY = "idp:prefs";

const load = (): PrefsState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        hiddenByPersona: parsed.hiddenByPersona ?? {},
        collapsedDefault: !!parsed.collapsedDefault,
      };
    }
  } catch {
    /* ignore */
  }
  return { hiddenByPersona: {}, collapsedDefault: false };
};

interface PreferencesCtx {
  /** hidden nav paths for the active persona */
  hidden: string[];
  isHidden: (path: string) => boolean;
  toggleNav: (path: string) => void;
  showAll: () => void;
  hideAll: (paths: string[]) => void;
  collapsedDefault: boolean;
  setCollapsedDefault: (b: boolean) => void;
}

const PreferencesContext = createContext<PreferencesCtx | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const persona = user?.persona ?? "";
  const [state, setState] = useState<PrefsState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const hidden = state.hiddenByPersona[persona] ?? [];

  const setHidden = useCallback(
    (next: string[]) =>
      setState((s) => ({ ...s, hiddenByPersona: { ...s.hiddenByPersona, [persona]: next } })),
    [persona]
  );

  const toggleNav = useCallback(
    (path: string) =>
      setState((s) => {
        const cur = s.hiddenByPersona[persona] ?? [];
        const next = cur.includes(path) ? cur.filter((p) => p !== path) : [...cur, path];
        return { ...s, hiddenByPersona: { ...s.hiddenByPersona, [persona]: next } };
      }),
    [persona]
  );

  const showAll = useCallback(() => setHidden([]), [setHidden]);
  const hideAll = useCallback((paths: string[]) => setHidden([...new Set(paths)]), [setHidden]);
  const setCollapsedDefault = useCallback(
    (b: boolean) => setState((s) => ({ ...s, collapsedDefault: b })),
    []
  );

  const value: PreferencesCtx = {
    hidden,
    isHidden: (p) => hidden.includes(p),
    toggleNav,
    showAll,
    hideAll,
    collapsedDefault: state.collapsedDefault,
    setCollapsedDefault,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = (): PreferencesCtx => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
};
