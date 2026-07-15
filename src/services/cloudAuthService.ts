import { SignUpProfileInput, UserProfile, UserRole } from "../types/user";
import { createTemporaryPassword } from "./passwordService";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const configuredPublicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
const sessionKey = "powerful-lesson-planner:supabase-session";

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
}

interface SupabaseSignUpResponse {
  access_token?: string;
  refresh_token?: string;
  id?: string;
  email?: string;
  user?: { id?: string; email?: string };
}

interface SupabaseUserResponse {
  id?: string;
  email?: string;
  user?: { id?: string; email?: string };
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

const hasUsableCloudConfig = Boolean(
  configuredSupabaseUrl &&
  supabaseAnonKey &&
  !configuredSupabaseUrl.includes("your-project-ref") &&
  !supabaseAnonKey.includes("your-supabase-anon-public-key")
);
const enabled = hasUsableCloudConfig;
const supabaseUrl = (configuredSupabaseUrl || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

const authUrl = (path: string) => `${supabaseUrl}/auth/v1/${path}`;
const restUrl = (path: string) => `${supabaseUrl}/rest/v1/${path}`;
const productionAppUrl = configuredPublicAppUrl || "https://propheticpowerfulman.github.io/LessonPlanPowerfullyDone/";

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
    if (response.status === 429) {
      throw new Error("Too many account requests were sent in a short time. Please wait a few minutes before trying again, or ask a school authority to create or activate the account.");
    }
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

const fetchCurrentProfile = async (userId: string, accessToken: string) => {
  const rows = await request<Record<string, unknown>[]>(restUrl(`profiles?id=eq.${userId}&select=*`), {
    headers: baseHeaders(accessToken)
  });
  return rows[0] ? toProfile(rows[0]) : null;
};

const getPublicAppLoginUrl = (temporaryPassword?: string) => {
  const normalizedProductionUrl = productionAppUrl.endsWith("/") ? productionAppUrl : `${productionAppUrl}/`;
  const temporaryQuery = temporaryPassword ? `?temporary_password=${encodeURIComponent(temporaryPassword)}` : "";
  if (typeof window === "undefined") return `${normalizedProductionUrl}${temporaryQuery}#/login`;
  const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(window.location.hostname);
  const currentAppUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const appUrl = isLocalHost ? currentAppUrl : normalizedProductionUrl;
  return `${appUrl}${temporaryQuery}#/login`;
};

export const cloudAuthService = {
  enabled,
  required: false,
  configurationError: "",
  getAccessToken() {
    const session = readSession();
    return session?.accessToken || supabaseAnonKey || "";
  },
  restUrl,
  baseHeaders,
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
      return await fetchCurrentProfile(session.userId, session.accessToken);
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
    let profile: UserProfile | null = null;
    try {
      profile = await fetchCurrentProfile(session.user.id, session.access_token);
    } catch (error) {
      localStorage.removeItem(sessionKey);
      throw error;
    }
    if (!profile || profile.status !== "active") {
      localStorage.removeItem(sessionKey);
      throw new Error("This account is waiting for activation by the school authority.");
    }
    return profile;
  },
  async signUp(input: SignUpProfileInput) {
    const redirectTo = getPublicAppLoginUrl();
    const signUpResponse = await request<SupabaseSignUpResponse>(`${authUrl("signup")}?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        email_redirect_to: redirectTo,
        data: {
          name: input.name.trim(),
          role: input.role,
          department: input.department.trim() || (input.role === "teacher" ? "Teaching" : "Administration"),
          subjects: parseList(input.subjects),
          grade_classes: parseList(input.gradeClasses)
        }
      })
    });
    const userId = signUpResponse.user?.id || signUpResponse.id;
    if (!userId) {
      throw new Error("Account creation started, but Supabase did not return a user id. Please check whether email confirmation is required, then try signing in after confirmation.");
    }
    const profile = defaultProfile(input, userId);
    return profile;
  },
  async resetPassword(email: string, temporaryPassword?: string) {
    const redirectTo = getPublicAppLoginUrl(temporaryPassword);
    await request(`${authUrl("recover")}?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        redirect_to: redirectTo
      })
    });
    return temporaryPassword;
  },
  async createRecoveryPassword(email: string) {
    const temporaryPassword = createTemporaryPassword();
    await this.setUserPasswordByEmail(email, temporaryPassword);
    await this.resetPassword(email, temporaryPassword);
    return temporaryPassword;
  },
  async setUserPasswordByEmail(email: string, password: string) {
    const session = readSession();
    const token = session?.accessToken || supabaseAnonKey;
    await request(restUrl("rpc/set_auth_user_password_by_authority"), {
      method: "POST",
      headers: baseHeaders(token),
      body: JSON.stringify({
        target_email: email.trim().toLowerCase(),
        new_password: password
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
  async changeEmail(nextEmail: string, currentPassword: string) {
    const session = readSession();
    if (!session) throw new Error("Please sign in again before changing your email.");
    const profile = await this.getCurrentUser();
    if (!profile) throw new Error("Current user profile was not found.");
    const email = nextEmail.trim().toLowerCase();
    if (!email || email === profile.email.toLowerCase()) throw new Error("Enter a new email address.");
    await request<SupabaseSession>(authUrl("token?grant_type=password"), {
      method: "POST",
      body: JSON.stringify({ email: profile.email, password: currentPassword })
    });
    const updated = await request<SupabaseUserResponse>(authUrl("user"), {
      method: "PUT",
      headers: baseHeaders(session.accessToken),
      body: JSON.stringify({
        email,
        email_redirect_to: getPublicAppLoginUrl(),
        data: {
          name: profile.name,
          role: profile.role,
          department: profile.department,
          subjects: profile.subjects,
          grade_classes: profile.gradeClasses
        }
      })
    });
    const confirmedEmail = (updated.user?.email || updated.email || "").toLowerCase();
    if (confirmedEmail === email) {
      await request(restUrl(`profiles?id=eq.${profile.id}`), {
        method: "PATCH",
        headers: { ...baseHeaders(session.accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({ email, updated_at: new Date().toISOString() })
      });
    }
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
    await request(restUrl("rpc/delete_auth_user_by_authority"), {
      method: "POST",
      headers: baseHeaders(token),
      body: JSON.stringify({ target_user_id: id })
    }).catch(async () => {
      await request(restUrl(`profiles?id=eq.${id}`), {
        method: "PATCH",
        headers: { ...baseHeaders(token), Prefer: "return=minimal" },
        body: JSON.stringify({
          email: `deleted-${id}-${Date.now()}@deleted.local`,
          status: "inactive",
          updated_at: new Date().toISOString()
        })
      });
    });
  }
};
