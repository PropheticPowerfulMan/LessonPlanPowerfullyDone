import { UserProfile, UserRole } from "../types/user";
import { cloudAuthService } from "./cloudAuthService";

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

const cloudHeaders = (extra: Record<string, string> = {}) => ({
  ...cloudAuthService.baseHeaders(cloudAuthService.getAccessToken()),
  ...extra
});

const cloudRequest = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(cloudAuthService.restUrl(path), {
    ...options,
    headers: {
      ...cloudHeaders(),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.msg || data?.error_description || "Message cloud request failed";
    throw new Error(message);
  }
  return data as T;
};

const toCloudRow = (message: AppMessage) => ({
  id: message.id,
  sender_id: message.senderId,
  sender_name: message.senderName,
  audience: message.audience,
  target: message.target,
  subject: message.subject,
  body: message.body,
  read_by: message.readBy,
  created_at: message.createdAt
});

const fromCloudRow = (row: Record<string, unknown>): AppMessage => ({
  id: String(row.id || ""),
  senderId: String(row.sender_id || ""),
  senderName: String(row.sender_name || ""),
  audience: String(row.audience || "all") as MessageAudience,
  target: String(row.target || ""),
  subject: String(row.subject || ""),
  body: String(row.body || ""),
  createdAt: String(row.created_at || new Date().toISOString()),
  readBy: Array.isArray(row.read_by) ? row.read_by.map(String) : []
});

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
  async listForUserAsync(user: UserProfile) {
    if (!cloudAuthService.enabled) return this.listForUser(user);
    const rows = await cloudRequest<Record<string, unknown>[]>("app_messages?select=*&order=created_at.desc");
    const messages = rows.map(fromCloudRow);
    write(messages);
    return messages.filter((message) => canReceive(message, user));
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
  async sendAsync(input: { sender: UserProfile; audience: MessageAudience; target: string; subject: string; body: string }) {
    const message = this.send(input);
    if (!cloudAuthService.enabled) return message;
    const rows = await cloudRequest<Record<string, unknown>[]>("app_messages?select=*", {
      method: "POST",
      headers: cloudHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(toCloudRow(message))
    });
    const cloudMessage = rows[0] ? fromCloudRow(rows[0]) : message;
    write([cloudMessage, ...read().filter((item) => item.id !== message.id)]);
    return cloudMessage;
  },
  markRead(id: string, userId: string) {
    write(read().map((message) => message.id === id ? { ...message, readBy: Array.from(new Set([...message.readBy, userId])) } : message));
  },
  async markReadAsync(id: string, userId: string) {
    const message = read().find((item) => item.id === id);
    const readBy = Array.from(new Set([...(message?.readBy || []), userId]));
    this.markRead(id, userId);
    if (!cloudAuthService.enabled) return;
    await cloudRequest(`app_messages?id=eq.${id}`, {
      method: "PATCH",
      headers: cloudHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({ read_by: readBy })
    });
  },
  unreadCount(user: UserProfile) {
    return this.listForUser(user).filter((message) => !message.readBy.includes(user.id)).length;
  }
};

export const roleTargetOptions: UserRole[] = ["administrator", "principal", "vice-principal", "head-of-department", "teacher"];
