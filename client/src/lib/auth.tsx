import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const isUiPreview = import.meta.env.VITE_UI_PREVIEW_MODE === "true";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, country: string, password: string) => Promise<void>;
  register: (data: { fullName: string; phone: string; country: string; password: string; invitationCode?: string; otpCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (isUiPreview) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (phone: string, country: string, password: string) => {
    if (isUiPreview) {
      throw new Error("La connexion est désactivée dans l’aperçu sans base de données.");
    }
    const response = await apiRequest("POST", "/api/auth/login", { phone, country, password });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Vérifiez votre numéro et votre mot de passe, puis réessayez.");
    }
    setUser(data.user);
  };

  const register = async (data: { fullName: string; phone: string; country: string; password: string; invitationCode?: string; otpCode?: string }) => {
    if (isUiPreview) {
      throw new Error("L’inscription est désactivée dans l’aperçu sans base de données.");
    }
    const response = await apiRequest("POST", "/api/auth/register", data);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Vérifiez les informations saisies et réessayez.");
    }
    setUser(result.user);
  };

  const logout = async () => {
    if (isUiPreview) {
      setUser(null);
      return;
    }
    await apiRequest("POST", "/api/auth/logout", {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
