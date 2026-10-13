import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../services/api.service";

export interface AuthState {
  accessToken: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const storageKey = "gym_genius_auth";

function getInitialAuth(): AuthState {
  const raw = localStorage.getItem(storageKey) || localStorage.getItem("lions_gym_auth");
  if (!raw) {
    return { accessToken: null };
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { accessToken: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const initial = getInitialAuth();
    setAuthToken(initial.accessToken); // set synchronously, don't wait for effect
    return initial;
  });

  useEffect(() => {
    setAuthToken(state.accessToken);
  }, [state.accessToken]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const accessToken = response.data.accessToken as string;
    setAuthToken(accessToken); // set BEFORE navigate/re-render so child requests carry it
    const nextState = { accessToken };
    setState(nextState);
    localStorage.setItem(storageKey, JSON.stringify(nextState));
  }, []);

  const logout = useCallback(() => {
    setState({ accessToken: null });
    localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.accessToken),
      login,
      logout
    }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}