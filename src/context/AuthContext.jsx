// File: src/context/AuthContext.jsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = "vehicle-support-demo-session";

/*
 * Read the previously saved demo session.
 *
 * This is convenient for development but is not suitable for
 * storing real authentication tokens in a production application.
 */

function readSavedSession() {
  try {
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!savedSession) {
      return null;
    }

    const parsedSession = JSON.parse(savedSession);

    if (
      !parsedSession ||
      !parsedSession.user ||
      !["Administrator", "Authorised Operator"].includes(
        parsedSession.user.role
      )
    ) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsedSession;
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSavedSession);
  const [loading, setLoading] = useState(false);

  /*
   * Save the demo session in sessionStorage.
   *
   * The session remains available when the user refreshes the tab,
   * but is normally cleared when the browsing session ends.
   */

  useEffect(() => {
    if (session) {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(session)
      );
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  /*
   * Authenticate through the mock API service.
   */

  const login = useCallback(async (credentials) => {
    setLoading(true);

    try {
      const response = await api.login(credentials);

      if (!response.success) {
        return {
          success: false,
          message: response.message,
        };
      }

      setSession(response.data);

      return {
        success: true,
        message: response.message,
      };
    } catch {
      return {
        success: false,
        message: "Unable to complete the login request.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Clear the current demo session.
   */

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await api.logout();
    } finally {
      setSession(null);
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.user),
      loading,
      login,
      logout,
    }),
    [session, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
 * Convenient hook for accessing authentication state.
 */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}