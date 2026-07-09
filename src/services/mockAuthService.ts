import { UserProfile } from "../types/user";

const currentUserKey = "powerful-lesson-planner:current-user-id";
const usersKey = "powerful-lesson-planner:users";
const demoPassword = "kcs2026";
const now = "2026-07-09T00:00:00.000Z";

export const mockUsers: UserProfile[] = [
  {
    id: "user-admin",
    name: "System Administrator",
    email: "admin@kcs.local",
    role: "administrator",
    department: "Administration",
    subjects: [],
    gradeClasses: [],
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-principal",
    name: "KCS Principal",
    email: "principal@kcs.local",
    role: "principal",
    department: "Administration",
    subjects: [],
    gradeClasses: [],
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-vp",
    name: "Vice Principal",
    email: "viceprincipal@kcs.local",
    role: "vice-principal",
    department: "Administration",
    subjects: [],
    gradeClasses: [],
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-hod-english",
    name: "English HOD",
    email: "english.hod@kcs.local",
    role: "head-of-department",
    department: "English",
    subjects: ["English", "English (Writing and Grammar)"],
    gradeClasses: ["Grade 7", "Grade 8", "Grade 9"],
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-teacher-english",
    name: "Grace Mbuyi",
    email: "grace.mbuyi@kcs.local",
    role: "teacher",
    department: "English",
    subjects: ["English", "English (Writing and Grammar)"],
    gradeClasses: ["Grade 7", "Grade 8"],
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-teacher-math",
    name: "Daniel Kim",
    email: "daniel.kim@kcs.local",
    role: "teacher",
    department: "Mathematics",
    subjects: ["Mathematics"],
    gradeClasses: ["Grade 9", "Grade 10"],
    status: "active",
    createdAt: now,
    updatedAt: now
  }
];

const readUsers = (): UserProfile[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(usersKey) || "[]") as UserProfile[];
    return stored.length ? stored : seedUsers();
  } catch {
    return seedUsers();
  }
};

const seedUsers = () => {
  localStorage.setItem(usersKey, JSON.stringify(mockUsers));
  return mockUsers;
};

const readCurrentUserId = () => localStorage.getItem(currentUserKey);

export const mockAuthService = {
  demoPassword,
  listUsers() {
    return readUsers();
  },
  getCurrentUser() {
    const currentUserId = readCurrentUserId();
    if (!currentUserId) return null;
    const users = readUsers();
    return users.find((user) => user.id === currentUserId && user.status === "active") || null;
  },
  signIn(email: string, password: string) {
    const user = readUsers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.status === "active");
    if (!user || password !== demoPassword) throw new Error("Invalid email or password");
    localStorage.setItem(currentUserKey, user.id);
    return user;
  },
  signOut() {
    localStorage.removeItem(currentUserKey);
  },
  updateProfile(profile: UserProfile) {
    const users = readUsers().map((user) => (user.id === profile.id ? { ...profile, updatedAt: new Date().toISOString() } : user));
    localStorage.setItem(usersKey, JSON.stringify(users));
    return users.find((user) => user.id === profile.id) || profile;
  }
};
