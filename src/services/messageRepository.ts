import { UserProfile, UserRole } from "../types/user";

export type MessageAudience = "all" | "role" | "department" | "user";

export interface AppMessage {
  id: string;
  senderId: string;
  senderName: string;
  audience: MessageAudience;
  target: string;
  subject: string;
  body: string;
  createdAt: string;
  readBy: string[];
}

const key = "powerful-lesson-planner:messages";

const read = (): AppMessage[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as AppMessage[];
  } catch {
    return [];
  }
};

const write = (messages: AppMessage[]) => localStorage.setItem(key, JSON.stringify(messages));

const canReceive = (message: AppMessage, user: UserProfile) => {
  if (message.senderId === user.id) return true;
  if (message.audience === "all") return true;
  if (message.audience === "user") return message.target === user.id;
  if (message.audience === "role") return message.target === user.role;
  if (message.audience === "department") return message.target === user.department;
  return false;
};

export const messageRepository = {
  listForUser(user: UserProfile) {
    return read()
      .filter((message) => canReceive(message, user))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  send(input: { sender: UserProfile; audience: MessageAudience; target: string; subject: string; body: string }) {
    const now = new Date().toISOString();
    const message: AppMessage = {
      id: crypto.randomUUID(),
      senderId: input.sender.id,
      senderName: input.sender.name,
      audience: input.audience,
      target: input.target,
      subject: input.subject.trim(),
      body: input.body.trim(),
      createdAt: now,
      readBy: [input.sender.id]
    };
    write([message, ...read()]);
    return message;
  },
  markRead(id: string, userId: string) {
    write(read().map((message) => message.id === id ? { ...message, readBy: Array.from(new Set([...message.readBy, userId])) } : message));
  },
  unreadCount(user: UserProfile) {
    return this.listForUser(user).filter((message) => !message.readBy.includes(user.id)).length;
  }
};

export const roleTargetOptions: UserRole[] = ["administrator", "principal", "vice-principal", "head-of-department", "teacher"];
