import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { EMPLOYEES, getEmployee, type EmployeeProfile } from '@/idp/identity/directory';
import { resolvePersona, type PersonaMatch } from '@/idp/identity/resolvePersona';

/**
 * Identity-driven auth with a real session + persisted roster.
 *
 * You are signed in as a *profile* (one you create at onboarding, or a demo
 * person from the directory). The persona is DERIVED from that profile — you
 * never pick it directly. Created profiles are saved to a roster in
 * localStorage, so you can log out and log back in as any previous engineer,
 * and profile edits persist. `user` keeps the historical `{ persona, name }`
 * shape so existing screens keep working; `persona` is computed, never stored.
 */
export interface User {
  persona: string;
  name: string;
}

const PROFILES_KEY = 'idp_profiles';   // roster of user-created engineer profiles
const ACTIVE_KEY = 'idp_active';       // id of the signed-in profile ("" = logged out)
const EDITS_KEY = 'idp_profile_edits'; // patches applied to demo directory people

type EditMap = Record<string, Partial<EmployeeProfile>>;

export const BLANK_PROFILE: EmployeeProfile = {
  id: '', name: 'You', email: 'you@acme.io', title: '', department: '', team: '',
  location: 'Remote', seniority: 'Senior', skills: [], systems: [], bio: '',
};

const isBrowser = typeof window !== 'undefined';
const uid = () => `eng-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const readProfiles = (): EmployeeProfile[] => {
  if (!isBrowser) return [];
  try {
    const arr = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '[]');
    return Array.isArray(arr) ? (arr as EmployeeProfile[]) : [];
  } catch { return []; }
};

const readActive = (): string | null => {
  if (!isBrowser) return null;
  const v = localStorage.getItem(ACTIVE_KEY);
  return v && v.length ? v : null;
};

const readEdits = (): EditMap => {
  if (!isBrowser) return {};
  try { return JSON.parse(localStorage.getItem(EDITS_KEY) ?? '{}') as EditMap; } catch { return {}; }
};

interface AuthContextType {
  /** the signed-in user, or null when logged out */
  user: User | null;
  /** the full, effective profile of the signed-in person */
  profile: EmployeeProfile;
  /** the persona derivation result: id, label, confidence, reason, signals */
  personaMatch: PersonaMatch;
  /** whether someone is signed in */
  loggedIn: boolean;
  /** demo directory people (fixed) */
  directory: EmployeeProfile[];
  /** the user's own created & saved profiles (the roster) */
  savedProfiles: EmployeeProfile[];
  /** create + save a new profile from onboarding and sign in as it; returns its id */
  createProfile: (profile: Partial<EmployeeProfile>) => string;
  /** add a saved profile WITHOUT signing in (admin sets up profiles behind the scenes); returns its id */
  addProfile: (profile: Partial<EmployeeProfile>) => string;
  /** patch any saved profile by id (admin editing) */
  updateProfileById: (id: string, patch: Partial<EmployeeProfile>) => void;
  /** remove a saved profile from the roster */
  deleteProfile: (id: string) => void;
  /** sign in as a saved or demo profile by id */
  signInAs: (id: string) => void;
  /** end the session (returns to the sign-in gate) */
  logout: () => void;
  /** patch the active profile; persists for created profiles, re-derives persona */
  updateProfile: (patch: Partial<EmployeeProfile>) => void;
  /** revert edits made to a demo directory person */
  resetProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>(() => readProfiles());
  const [activeId, setActiveId] = useState<string | null>(() => readActive());
  const [edits, setEdits] = useState<EditMap>(() => readEdits());

  useEffect(() => { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch { /* ignore */ } }, [profiles]);
  useEffect(() => { try { localStorage.setItem(ACTIVE_KEY, activeId ?? ''); } catch { /* ignore */ } }, [activeId]);
  useEffect(() => { try { localStorage.setItem(EDITS_KEY, JSON.stringify(edits)); } catch { /* ignore */ } }, [edits]);

  const loggedIn = activeId != null;
  const activeCreated = useMemo(
    () => profiles.find((p) => p.id === activeId),
    [profiles, activeId]
  );

  const profile = useMemo<EmployeeProfile>(() => {
    if (!activeId) return BLANK_PROFILE;
    if (activeCreated) return activeCreated;
    return { ...getEmployee(activeId), ...(edits[activeId] ?? {}) };
  }, [activeId, activeCreated, edits]);

  const personaMatch = useMemo(() => resolvePersona(profile), [profile]);

  const createProfile = useCallback((patch: Partial<EmployeeProfile>) => {
    const id = uid();
    const p: EmployeeProfile = { ...BLANK_PROFILE, ...patch, id };
    setProfiles((prev) => [...prev, p]);
    setActiveId(id);
    return id;
  }, []);

  const addProfile = useCallback((patch: Partial<EmployeeProfile>) => {
    const id = uid();
    const p: EmployeeProfile = { ...BLANK_PROFILE, ...patch, id };
    setProfiles((prev) => [...prev, p]);
    return id;
  }, []);

  const updateProfileById = useCallback((id: string, patch: Partial<EmployeeProfile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const signInAs = useCallback((id: string) => {
    if (id) setActiveId(id);
  }, []);

  const logout = useCallback(() => setActiveId(null), []);

  const updateProfile = useCallback((patch: Partial<EmployeeProfile>) => {
    if (!activeId) return;
    if (profiles.some((p) => p.id === activeId)) {
      setProfiles((prev) => prev.map((p) => (p.id === activeId ? { ...p, ...patch } : p)));
    } else {
      setEdits((prev) => ({ ...prev, [activeId]: { ...prev[activeId], ...patch } }));
    }
  }, [activeId, profiles]);

  const resetProfile = useCallback(() => {
    if (!activeId) return;
    setEdits((prev) => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
  }, [activeId]);

  const user: User | null = loggedIn ? { persona: personaMatch.personaId, name: profile.name } : null;

  return (
    <AuthContext.Provider
      value={{
        user, profile, personaMatch, loggedIn,
        directory: EMPLOYEES, savedProfiles: profiles,
        createProfile, addProfile, updateProfileById, deleteProfile,
        signInAs, logout, updateProfile, resetProfile,
      }}
    >
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
