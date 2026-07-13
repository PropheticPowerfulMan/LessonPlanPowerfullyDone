import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { mockAuthService } from "../services/mockAuthService";
import { Permission, UserProfile } from "../types/user";
import { hasPermission } from "../services/permissions";

interface AuthContextValue {
  currentUser: UserProfile | null;
  users: UserProfile[];
  signIn: (email: string, password: string) => void;
  signOut: () => void;
  updateProfile: (profile: UserProfile) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState(() => mockAuthService.listUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    mockAuthService.signOut();
    return null;
  });

  const signIn = (email: string, password: string) => {
    const user = mockAuthService.signIn(email, password);
    setCurrentUser(user);
  };

  const signOut = () => {
    mockAuthService.signOut();
    setCurrentUser(null);
  };

  const updateProfile = (profile: UserProfile) => {
    const next = mockAuthService.updateProfile(profile);
    setUsers(mockAuthService.listUsers());
    setCurrentUser((current) => (current?.id === next.id ? next : current));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      users,
      signIn,
      signOut,
      updateProfile,
      can: (permission) => hasPermission(currentUser, permission)
    }),
    [currentUser, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
