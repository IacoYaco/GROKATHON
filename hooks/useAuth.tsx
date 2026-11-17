"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { permissionsFor } from "@/lib/permissions";
import type { CeidAccount, CeidPermissions, CeidRole } from "@/types/ceid";

interface AuthState {
  loading: boolean;
  identityVerified: boolean;
  identityName: string;
  identityEmail: string;
  simulated: boolean;
  casLive: boolean;
  demoAuthAllowed: boolean;
  demoFacultyAllowed: boolean;
  account: CeidAccount | null;
  permissions: CeidPermissions;
  refresh: () => Promise<void>;
  demoLogin: (input: {
    role: CeidRole;
    netid?: string;
    displayName?: string;
    college?: string;
    classYear?: string;
  }) => Promise<void>;
  startCasLogin: () => void;
  logoutYale: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [identityName, setIdentityName] = useState("");
  const [identityEmail, setIdentityEmail] = useState("");
  const [simulated, setSimulated] = useState(false);
  const [casLive, setCasLive] = useState(false);
  const [demoAuthAllowed, setDemoAuthAllowed] = useState(false);
  const [demoFacultyAllowed, setDemoFacultyAllowed] = useState(false);
  const [account, setAccount] = useState<CeidAccount | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = await res.json();
      setIdentityVerified(Boolean(json.identityVerified));
      setIdentityName(json.identityName || "");
      setIdentityEmail(json.identityEmail || "");
      setSimulated(Boolean(json.simulated));
      setCasLive(Boolean(json.casLive));
      setDemoAuthAllowed(Boolean(json.demoAuthAllowed));
      setDemoFacultyAllowed(Boolean(json.demoFacultyAllowed));
      setAccount(json.account || null);
    } catch {
      setAccount(null);
      setDemoAuthAllowed(false);
      setDemoFacultyAllowed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const demoLogin = useCallback(
    async (input: {
      role: CeidRole;
      netid?: string;
      displayName?: string;
      college?: string;
      classYear?: string;
    }) => {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Demo login failed");
      }
      await refresh();
    },
    [refresh]
  );

  const startCasLogin = useCallback(() => {
    window.location.href = "/api/auth/cas/login";
  }, []);

  const logoutYale = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      identityVerified,
      identityName,
      identityEmail,
      simulated,
      casLive,
      demoAuthAllowed,
      demoFacultyAllowed,
      account,
      permissions: permissionsFor(account?.role ?? null),
      refresh,
      demoLogin,
      startCasLogin,
      logoutYale,
    }),
    [
      loading,
      identityVerified,
      identityName,
      identityEmail,
      simulated,
      casLive,
      demoAuthAllowed,
      demoFacultyAllowed,
      account,
      refresh,
      demoLogin,
      startCasLogin,
      logoutYale,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
