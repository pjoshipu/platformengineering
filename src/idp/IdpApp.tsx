import { Navigate, useRoutes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { getPersonaModule } from "./personas/registry";
import { useAuth } from "@/contexts/AuthContext";

/**
 * IDP entry mounted at /idp/* by App.tsx. The experience is scoped to the
 * logged-in persona: only that persona's routes are mounted, and anything else
 * redirects to their dashboard. Switching personas = log out and back in.
 */
const IdpApp = () => {
  const { user } = useAuth();
  const persona = user ? getPersonaModule(user.persona) : undefined;

  const first = persona?.nav[0]?.path ?? "dashboard";
  const home = persona ? `${persona.id}/${first}` : "";

  const element = useRoutes([
    { index: true, element: <Navigate to={home} replace /> },
    ...(persona?.routes ?? []),
    { path: "*", element: <Navigate to={home} replace /> },
  ]);

  if (!user || !persona) return <Navigate to="/" replace />;

  return <AppShell>{element}</AppShell>;
};

export default IdpApp;
