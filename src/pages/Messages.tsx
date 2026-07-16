import { FormEvent, useMemo, useState } from "react";
import { Mail, Search, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog } from "../components/ui/dialog";
import { Input, Select, Textarea } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { AppMessage, MessageAudience, messageRepository, roleTargetOptions } from "../services/messageRepository";
import { roleLabels } from "../types/user";

export const Messages = () => {
  const { currentUser, users, can } = useAuth();
  const { notify } = useToast();
  const [audience, setAudience] = useState<MessageAudience>("all");
  const [target, setTarget] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [senderFilter, setSenderFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openMessage, setOpenMessage] = useState<AppMessage | null>(null);
  const [version, setVersion] = useState(0);
  if (!currentUser) return null;

  const messages = useMemo(() => messageRepository.listForUser(currentUser), [currentUser, version]);
  const filteredMessages = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).map((term) => term.trim()).filter(Boolean);
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : Number.NaN;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.NaN;
    return messages.filter((message) => {
      const haystack = [
        message.subject,
        message.body,
        message.senderName,
        message.audience,
        message.target,
        new Date(message.createdAt).toLocaleString()
      ].join(" ").toLowerCase();
      const createdTime = new Date(message.createdAt).getTime();
      const isUnread = !message.readBy.includes(currentUser.id);
      return (
        terms.every((term) => haystack.includes(term)) &&
        (!senderFilter || message.senderId === senderFilter) &&
        (!audienceFilter || message.audience === audienceFilter) &&
        (!readFilter || (readFilter === "unread" ? isUnread : !isUnread)) &&
        (!dateFrom || (!Number.isNaN(createdTime) && createdTime >= fromTime)) &&
        (!dateTo || (!Number.isNaN(createdTime) && createdTime <= toTime))
      );
    });
  }, [audienceFilter, currentUser.id, dateFrom, dateTo, messages, query, readFilter, senderFilter]);
  const departments = useMemo(() => Array.from(new Set(users.map((user) => user.department).filter(Boolean))).sort(), [users]);
  const canBroadcast = can("users:manage") || ["administrator", "principal", "vice-principal", "head-of-department"].includes(currentUser.role);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    messageRepository.send({
      sender: currentUser,
      audience: canBroadcast ? audience : "user",
      target: canBroadcast ? target : "user-admin",
      subject,
      body
    });
    setSubject("");
    setBody("");
    setVersion((value) => value + 1);
    notify("Message sent");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <Card className="p-4">
        <h1 className="flex items-center gap-2 text-2xl font-black text-white"><Mail size={22} /> Communication</h1>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          {canBroadcast && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Audience">
                <Select value={audience} onChange={(event) => { setAudience(event.target.value as MessageAudience); setTarget(""); }}>
                  <option value="all">Everyone</option>
                  <option value="role">Role</option>
                  <option value="department">Department</option>
                  <option value="user">User</option>
                </Select>
              </Field>
              <Field label="Target">
                <Select value={target} onChange={(event) => setTarget(event.target.value)} disabled={audience === "all"}>
                  <option value="">Choose target</option>
                  {audience === "role" && roleTargetOptions.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                  {audience === "department" && departments.map((department) => <option key={department} value={department}>{department}</option>)}
                  {audience === "user" && users.map((user) => <option key={user.id} value={user.id}>{user.name} - {roleLabels[user.role]}</option>)}
                </Select>
              </Field>
            </div>
          )}
          <Field label="Subject"><Input value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
          <Field label="Message"><Textarea className="min-h-36" value={body} onChange={(event) => setBody(event.target.value)} /></Field>
          <Button type="submit" disabled={!subject.trim() || !body.trim() || (canBroadcast && audience !== "all" && !target)}>
            <Send size={16} /> Send
          </Button>
        </form>
      </Card>
      <div className="space-y-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Search size={17} className="text-cyan-200" />
            <p className="text-sm font-black text-white">Search messages</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Keywords"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="subject, content, sender..." /></Field>
            <Field label="Sender">
              <Select value={senderFilter} onChange={(event) => setSenderFilter(event.target.value)}>
                <option value="">Any sender</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </Select>
            </Field>
            <Field label="Audience">
              <Select value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}>
                <option value="">Any audience</option>
                <option value="all">Everyone</option>
                <option value="role">Role</option>
                <option value="department">Department</option>
                <option value="user">User</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={readFilter} onChange={(event) => setReadFilter(event.target.value)}>
                <option value="">Read and unread</option>
                <option value="unread">Unread only</option>
                <option value="read">Read only</option>
              </Select>
            </Field>
            <Field label="From"><Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></Field>
            <Field label="To"><Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-muted-foreground">{filteredMessages.length} of {messages.length} message{messages.length === 1 ? "" : "s"} shown</p>
            <Button variant="outline" className="h-8 px-3" onClick={() => { setQuery(""); setSenderFilter(""); setAudienceFilter(""); setReadFilter(""); setDateFrom(""); setDateTo(""); }}>Clear filters</Button>
          </div>
        </Card>
        {filteredMessages.map((message) => (
          <Card
            key={message.id}
            className="cursor-pointer p-4 transition hover:border-cyan-300/35 hover:bg-cyan-500/10"
            onClick={() => {
              messageRepository.markRead(message.id, currentUser.id);
              setOpenMessage(message);
              setVersion((value) => value + 1);
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-black text-white">{message.subject}</p>
                <p className="text-xs font-bold text-cyan-100">{message.senderName} - {new Date(message.createdAt).toLocaleString()}</p>
              </div>
              {!message.readBy.includes(currentUser.id) && <span className="rounded-sm bg-amber-400 px-2 py-1 text-xs font-black text-slate-950">New</span>}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{message.body}</p>
          </Card>
        ))}
        {filteredMessages.length === 0 && <Card className="p-8 text-center text-muted-foreground">No messages match this search.</Card>}
      </div>
      <Dialog open={Boolean(openMessage)} title={openMessage?.subject || "Message"} onClose={() => setOpenMessage(null)}>
        {openMessage && (
          <div className="space-y-4">
            <div className="rounded-md border border-cyan-300/15 bg-white/[0.04] p-3">
              <p className="text-sm font-black text-white">{openMessage.subject}</p>
              <p className="mt-1 text-xs font-bold text-cyan-100">From {openMessage.senderName} - {new Date(openMessage.createdAt).toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">Audience: {audienceLabel(openMessage.audience)}{openMessage.target ? ` - ${resolveTargetLabel(openMessage, users)}` : ""}</p>
            </div>
            <div className="max-h-[58dvh] overflow-auto rounded-md border border-cyan-300/15 bg-card/80 p-4">
              <p className="whitespace-pre-line text-sm leading-6 text-foreground">{openMessage.body}</p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

const audienceLabel = (audience: MessageAudience) => ({
  all: "Everyone",
  role: "Role",
  department: "Department",
  user: "User"
})[audience];

const resolveTargetLabel = (message: AppMessage, users: ReturnType<typeof useAuth>["users"]) => {
  if (message.audience === "role") return roleLabels[message.target as keyof typeof roleLabels] || message.target;
  if (message.audience === "user") return users.find((user) => user.id === message.target)?.name || message.target;
  return message.target;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="space-y-1">
    <Label>{label}</Label>
    {children}
  </label>
);
