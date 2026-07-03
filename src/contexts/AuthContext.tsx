import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Auth is client-side only (demo). A user is identified by the persona they
 * chose at login; that persona scopes the entire IDP experience they see.
 */
export interface User {
  /** IDP persona id, e.g. "data-scientist" (see src/idp/personas/registry.ts) */
  persona: string;
  /** display label, e.g. "Data Scientist" */
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (user: User) => {
    setUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  // Initialize from localStorage on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Only accept the current persona-based shape; ignore stale role-based sessions.
        if (parsed && typeof parsed.persona === 'string') {
          setUser(parsed);
        } else {
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
