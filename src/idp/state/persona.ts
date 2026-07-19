import { useAuth } from "@/contexts/AuthContext";

/**
 * One source of truth for the active persona across the homepage and the shell.
 * The persona is DERIVED from the signed-in identity's profile (AuthContext),
 * never picked — so there is no setter. Kept as a thin wrapper so components
 * don't reach into AuthContext directly and to avoid importing the persona
 * registry here (which would create an import cycle).
 */
export function usePersona() {
  const { user } = useAuth();
  return { persona: user?.persona ?? "ai-engineer" };
}
