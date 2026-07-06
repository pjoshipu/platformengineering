import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Persona is a *preference*, not an auth session. The IDP homepage is the front
 * door (no login): a first-time visitor defaults to "ai-engineer"; the choice is
 * remembered in localStorage["idp_persona"] and can be changed anytime from the
 * homepage tiles, the sidebar switcher, or the avatar menu.
 *
 * The context keeps the historical `{ persona, name }` user shape so existing
 * screens that read `useAuth().user.persona` keep working unchanged.
 */
export interface User {
  /** IDP persona id, e.g. "data-scientist" (see src/idp/personas/registry.tsx) */
  persona: string;
  /** display label, e.g. "Data Scientist" */
  name: string;
}

/** id → display label. Mirrors the registry labels; kept inline to avoid a
 *  circular import (screens import useAuth, the registry imports screens). */
const PERSONA_NAMES: Record<string, string> = {
  'ai-engineer': 'AI Engineer',
  'agentic-engineer': 'Agentic Engineer',
  'data-scientist': 'Data Scientist',
  'app-engineer': 'Platform Engineer',
  'mlops': 'MLOps Engineer',
  'security': 'Security Engineer',
  'data-engineer': 'Data Engineer',
};

const DEFAULT_PERSONA = 'ai-engineer';
export const PERSONA_KEY = 'idp_persona';

const userFor = (persona: string): User => ({
  persona,
  name: PERSONA_NAMES[persona] ?? persona,
});

const readPersona = (): string => {
  if (typeof window === 'undefined') return DEFAULT_PERSONA;
  const p = localStorage.getItem(PERSONA_KEY);
  return p && PERSONA_NAMES[p] ? p : DEFAULT_PERSONA;
};

interface AuthContextType {
  /** Always present now — persona is a preference, never a null session. */
  user: User | null;
  /** Change the active persona and persist it to localStorage["idp_persona"]. */
  setPersona: (persona: string) => void;
  /** Legacy: set the active persona from a full user object (used by Login). */
  login: (user: User) => void;
  /** Legacy: reset to the default persona. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => userFor(readPersona()));

  const setPersona = useCallback((persona: string) => {
    const next = userFor(persona);
    setUser(next);
    localStorage.setItem(PERSONA_KEY, persona);
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem(PERSONA_KEY, u.persona);
  }, []);

  const logout = useCallback(() => {
    setPersona(DEFAULT_PERSONA);
  }, [setPersona]);

  return (
    <AuthContext.Provider value={{ user, setPersona, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
