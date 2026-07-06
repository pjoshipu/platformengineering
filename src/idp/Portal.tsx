import { useRoutes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PreferencesProvider } from "./preferences";
import { JourneyProvider } from "./state/journey";
import { buildPortalRoutes } from "./routes";

/**
 * The IDP portal: one persistent shell hosting the whole root-level route table.
 * Persona is a preference (AuthContext / localStorage "idp_persona"), so there
 * is no login gate — the homepage at "/" is the front door.
 */
const Portal = () => {
  const element = useRoutes(buildPortalRoutes());
  return (
    <PreferencesProvider>
      <JourneyProvider>
        <AppShell>{element}</AppShell>
      </JourneyProvider>
    </PreferencesProvider>
  );
};

export default Portal;
