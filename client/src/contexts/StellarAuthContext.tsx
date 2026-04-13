import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface StellarUser {
  employeeId: number;
  email: string;
  name: string;
  platformRole: "rh" | "gestor" | "colaborador";
  secondaryPlatformRole?: "rh" | "gestor" | "colaborador" | null;
  managerId?: number | null;
  area?: string | null;
  diretoria?: string | null;
  cargo?: string | null;
  mustChangePassword?: boolean;
}

interface StellarAuthContextType {
  user: StellarUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const StellarAuthContext = createContext<StellarAuthContextType | null>(null);

export function StellarAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StellarUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Erro ao fazer login." };
      }
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Erro de conexão. Tente novamente." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <StellarAuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </StellarAuthContext.Provider>
  );
}

export function useStellarAuth() {
  const ctx = useContext(StellarAuthContext);
  if (!ctx) throw new Error("useStellarAuth must be used within StellarAuthProvider");
  return ctx;
}
