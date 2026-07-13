import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { cloudAuthService } from "../services/cloudAuthService";
import { mockAuthService } from "../services/mockAuthService";
import { AuthMode, Permission, SignUpProfileInput, UserProfile } from "../types/user";
import { hasPermission } from "../services/permissions";

interface AuthContextValue {
  currentUser: UserProfile | null;
  users: UserProfile[];
  authMode: AuthMode;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (profile: SignUpProfileInput) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState(() => mockAuthService.listUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(cloudAuthService.enabled);
  const authMode: AuthMode = cloudAuthService.enabled ? "cloud" : "local";

  const refreshUsers = async () => {
    const nextUsers = cloudAuthService.enabled ? await cloudAuthService.listUsers().catch(() => []) : mockAuthService.listUsers();
    setUsers(nextUsers);
    return nextUsers;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!cloudAuthService.enabled) {
        mockAuthService.signOut();
        return;
      }
      cloudAuthService.clearSession();
      setLoading(true);
      try {
        const nextUsers = await cloudAuthService.listUsers().catch(() => []);
        if (!mounted) return;
        setCurrentUser(null);
        setUsers(nextUsers);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const user = cloudAuthService.enabled ? await cloudAuthService.signIn(email, password) : mockAuthService.signIn(email, password);
    setCurrentUser(user);
    await refreshUsers();
  };

  const signUp = async (profile: SignUpProfileInput) => {
    if (cloudAuthService.enabled) {
      await cloudAuthService.signUp(profile);
    } else {
      mockAuthService.signUp(profile);
    }
    await refreshUsers();
  };

  const resetPassword = async (email: string) => {
    if (cloudAuthService.enabled) {
      await cloudAuthService.resetPassword(email);
      return;
    }
    mockAuthService.resetPassword(email);
  };

  const signOut = async () => {
    if (cloudAuthService.enabled) {
      await cloudAuthService.signOut();
    } else {
      mockAuthService.signOut();
    }
    setCurrentUser(null);
  };

  const updateProfile = async (profile: UserProfile) => {
    const next = cloudAuthService.enabled ? await cloudAuthService.updateProfile(profile) : mockAuthService.updateProfile(profile);
    await refreshUsers();
    setCurrentUser((current) => (current?.id === next.id ? next : current));
  };

  const deleteUser = async (id: string) => {
    if (cloudAuthService.enabled) {
      await cloudAuthService.deleteUser(id);
    } else {
      mockAuthService.deleteUser(id);
    }
    await refreshUsers();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      users,
      authMode,
      loading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      updateProfile,
      deleteUser,
      can: (permission) => hasPermission(currentUser, permission)
    }),
    [currentUser, users, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
