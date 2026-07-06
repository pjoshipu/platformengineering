import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/components/Login";

const Index = () => {
  const { user } = useAuth();

  // Not signed in → login. Signed in → the persona-scoped IDP is the primary
  // (and only) experience.
  if (!user) {
    return <Login />;
  }

  return <Navigate to="/" replace />;
};

export default Index;
