import { useRoutes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PreferencesProvider } from "./preferences";
import { JourneyProvider } from "./state/journey";
import { buildPortalRoutes } from "./routes";
import { useAuth } from "@/contexts/AuthContext";
import AuthGate from "./identity/AuthGate";

/**
 * The IDP portal: one persistent shell hosting the whole root-level route table.
 * Identity-driven — the persona is DERIVED from the signed-in profile. When no
 * one is signed in, the AuthGate (resume a saved profile / create a new one) is
 * shown; once signed in, the homepage at "/" is the front door and the derived
 * persona scopes everything.
 */
const Portal = () => {
  const { loggedIn } = useAuth();
  const element = useRoutes(buildPortalRoutes());

  if (!loggedIn) return <AuthGate />;

  return (
    <PreferencesProvider>
      <JourneyProvider>
        <AppShell>{element}</AppShell>
      </JourneyProvider>
    </PreferencesProvider>
  );
};

export default Portal;
