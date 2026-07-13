import { SignUpProfileInput, UserProfile, UserRole } from "../types/user";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const sessionKey = "powerful-lesson-planner:supabase-session";

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

const enabled = Boolean(supabaseUrl && supabaseAnonKey);

const authUrl = (path: string) => `${supabaseUrl}/auth/v1/${path}`;
const restUrl = (path: string) => `${supabaseUrl}/rest/v1/${path}`;

const baseHeaders = (token = supabaseAnonKey) => ({
  apikey: supabaseAnonKey || "",
  Authorization: `Bearer ${token || ""}`,
  "Content-Type": "application/json"
});

const request = async <T>(url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...baseHeaders(),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || "Cloud request failed";
    throw new Error(message);
  }
  return data as T;
};

const readSession = (): StoredSession | null => {
  try {
    return JSON.parse(localStorage.getItem(sessionKey) || "null") as StoredSession | null;
  } catch {
    return null;
  }
};

const clearSession = () => localStorage.removeItem(sessionKey);

const writeSession = (session: SupabaseSession) => {
  localStorage.setItem(sessionKey, JSON.stringify({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId: session.user.id
  }));
};

const parseList = (value: string[]) => value.map((item) => item.trim()).filter(Boolean);

const defaultProfile = (input: SignUpProfileInput, id: string): UserProfile => {
  const now = new Date().toISOString();
  return {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    department: input.department.trim() || (input.role === "teacher" ? "Teaching" : "Administration"),
    subjects: parseList(input.subjects),
    gradeClasses: parseList(input.gradeClasses),
    status: "inactive",
    createdAt: now,
    updatedAt: now
  };
};

const toProfile = (row: Record<string, unknown>): UserProfile => ({
  id: String(row.id || row.user_id || ""),
  name: String(row.name || ""),
  email: String(row.email || ""),
  role: String(row.role || "teacher") as UserRole,
  department: String(row.department || ""),
  subjects: Array.isArray(row.subjects) ? row.subjects.map(String) : [],
  gradeClasses: Array.isArray(row.grade_classes) ? row.grade_classes.map(String) : [],
  status: row.status === "inactive" ? "inactive" : "active",
  createdAt: String(row.created_at || new Date().toISOString()),
  updatedAt: String(row.updated_at || new Date().toISOString())
});

const fromProfile = (profile: UserProfile) => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  department: profile.department,
  subjects: profile.subjects,
  grade_classes: profile.gradeClasses,
  status: profile.status,
  updated_at: new Date().toISOString()
});

export const cloudAuthService = {
  enabled,
  async listUsers() {
    if (!enabled) return [];
    const session = readSession();
    const token = session?.accessToken || supabaseAnonKey;
    const rows = await request<Record<string, unknown>[]>(restUrl("profiles?select=*&order=name.asc"), {
      headers: baseHeaders(token)
    });
    return rows.map(toProfile);
  },
  clearSession,
  async getCurrentUser() {
    if (!enabled) return null;
    const session = readSession();
    if (!session) return null;
    try {
      const rows = await request<Record<string, unknown>[]>(restUrl(`profiles?id=eq.${session.userId}&select=*`), {
        headers: baseHeaders(session.accessToken)
      });
      return rows[0] ? toProfile(rows[0]) : null;
    } catch {
      localStorage.removeItem(sessionKey);
      return null;
    }
  },
  async signIn(email: string, password: string) {
    const session = await request<SupabaseSession>(authUrl("token?grant_type=password"), {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    });
    writeSession(session);
    const profile = await this.getCurrentUser();
    if (!profile || profile.status !== "active") {
      localStorage.removeItem(sessionKey);
      throw new Error("This account is waiting for activation by the school authority.");
    }
    return profile;
  },
  async signUp(input: SignUpProfileInput) {
    const session = await request<SupabaseSession>(authUrl("signup"), {
      method: "POST",
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        data: { name: input.name.trim(), role: input.role }
      })
    });
    const profile = defaultProfile(input, session.user.id);
    await request(restUrl("profiles"), {
      method: "POST",
      headers: { ...baseHeaders(session.access_token), Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(fromProfile(profile))
    });
    return profile;
  },
  async resetPassword(email: string) {
    await request(authUrl("recover"), {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        redirect_to: `${window.location.origin}${import.meta.env.BASE_URL}login`
      })
    });
  },
  async updatePasswordFromRecovery(accessToken: string, password: string) {
    await request(authUrl("user"), {
      method: "PUT",
      headers: baseHeaders(accessToken),
      body: JSON.stringify({ password })
    });
  },
  async changePassword(currentPassword: string, nextPassword: string) {
    const session = readSession();
    if (!session) throw new Error("Please sign in again before changing your password.");
    const profile = await this.getCurrentUser();
    if (!profile) throw new Error("Current user profile was not found.");
    await request<SupabaseSession>(authUrl("token?grant_type=password"), {
      method: "POST",
      body: JSON.stringify({ email: profile.email, password: currentPassword })
    });
    await request(authUrl("user"), {
      method: "PUT",
      headers: baseHeaders(session.accessToken),
      body: JSON.stringify({ password: nextPassword })
    });
  },
  async signOut() {
    const session = readSession();
    clearSession();
    if (session) {
      await request(authUrl("logout"), {
        method: "POST",
        headers: baseHeaders(session.accessToken)
      }).catch(() => undefined);
    }
  },
  async updateProfile(profile: UserProfile) {
    const session = readSession();
    const token = session?.accessToken || supabaseAnonKey;
    const rows = await request<Record<string, unknown>[]>(restUrl(`profiles?id=eq.${profile.id}&select=*`), {
      method: "PATCH",
      headers: { ...baseHeaders(token), Prefer: "return=representation" },
      body: JSON.stringify(fromProfile(profile))
    });
    return rows[0] ? toProfile(rows[0]) : profile;
  },
  async deleteUser(id: string) {
    const session = readSession();
    const token = session?.accessToken || supabaseAnonKey;
    await request(restUrl(`profiles?id=eq.${id}`), {
      method: "DELETE",
      headers: baseHeaders(token)
    });
  }
};
