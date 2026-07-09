import { motion } from "framer-motion";
import {
  Activity,
  Archive,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  GraduationCap,
  HardDrive,
  Layers3,
  type LucideIcon,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  XCircle
} from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { schoolDisplayName } from "../data/defaults";
import { useLessons } from "../hooks/useLessons";
import { LessonPlan, LessonStatus } from "../types/lesson";
import { roleLabels, UserProfile } from "../types/user";

type MetricTone = "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";
type ActivityItem = { id: string; title: string; detail: string; timestamp: string };
type DashboardContext = {
  lessons: LessonPlan[];
  users: UserProfile[];
  currentUser: UserProfile;
  navigate: ReturnType<typeof useNavigate>;
  createLesson: ReturnType<typeof useLessons>["createLesson"];
  stats: ReturnType<typeof buildStats>;
  recentActivity: ActivityItem[];
  upcoming: LessonPlan[];
  calendar: ReturnType<typeof buildCalendar>;
};

const reviewedStatuses: LessonStatus[] = ["approved", "final-approved", "published"];
const submittedStatuses: LessonStatus[] = ["submitted", "under-review"];
const rejectedStatuses: LessonStatus[] = ["rejected", "revision-requested"];

export const Dashboard = () => {
  const { imageUrl } = useApp();
  const { currentUser, users } = useAuth();
  const { lessons, createLesson } = useLessons();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const stats = useMemo(() => buildStats(lessons), [lessons]);
  const recentActivity = useMemo(() => buildRecentActivity(lessons), [lessons]);
  const upcoming = useMemo(() => buildUpcomingLessons(lessons), [lessons]);
  const calendar = useMemo(() => buildCalendar(new Date(), lessons), [lessons]);
  const context: DashboardContext = { lessons, users, currentUser, navigate, createLesson, stats, recentActivity, upcoming, calendar };

  const roleTitle = currentUser.role === "head-of-department" ? "HOD Dashboard" : `${roleLabels[currentUser.role]} Dashboard`;

  return (
    <div className="space-y-6">
      <section className="theme-dark-panel relative overflow-hidden rounded-lg border border-cyan-300/20 bg-[#061520]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,222,0.20),transparent_32%,rgba(16,185,129,0.12)_70%,rgba(251,191,36,0.10))]" />
        <div className="relative grid gap-6 p-5 text-white md:grid-cols-[1.35fr_0.65fr] md:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="badge">Version 1.5 Enterprise Dashboard</span>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-[#f8fdff] drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] md:text-4xl xl:text-5xl">{roleTitle}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50/80">
              Role-based operational command center for lesson planning, review workflows, curriculum progress, and school readiness at {schoolDisplayName}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-cyan-100">
              <span className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-white/[0.06] px-3 py-2"><ShieldCheck size={15} /> {roleLabels[currentUser.role]}</span>
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-500/10 px-3 py-2"><CheckCircle2 size={15} /> {stats.readiness}% inspection ready</span>
              <span className="inline-flex items-center gap-2 rounded-md border border-amber-300/20 bg-amber-500/10 px-3 py-2"><Clock3 size={15} /> {stats.submitted} awaiting review</span>
            </div>
          </motion.div>
          <div className="flex items-end justify-start gap-4 md:justify-end">
            <img src={imageUrl} alt="School identity" className="hidden h-24 w-24 rounded-lg border border-cyan-300/20 bg-white object-cover p-1 shadow-xl sm:block" />
            <Button
              className="h-11 px-5"
              onClick={() => {
                const lesson = createLesson();
                navigate(`/editor/${lesson.id}`);
              }}
            >
              <Plus size={19} /> New Lesson Plan
            </Button>
          </div>
        </div>
      </section>

      {currentUser.role === "teacher" && <TeacherDashboard context={context} />}
      {currentUser.role === "head-of-department" && <HodDashboard context={context} />}
      {(currentUser.role === "principal" || currentUser.role === "vice-principal") && <PrincipalDashboard context={context} />}
      {currentUser.role === "administrator" && <AdministratorDashboard context={context} />}
    </div>
  );
};

const TeacherDashboard = ({ context }: { context: DashboardContext }) => {
  const { lessons, stats, recentActivity, upcoming, navigate, createLesson } = context;
  return (
    <>
      <MetricGrid>
        <Metric icon={FileText} label="Total Lesson Plans" value={lessons.length} tone="cyan" />
        <Metric icon={Clock3} label="Drafts" value={stats.draft} tone="amber" />
        <Metric icon={ClipboardCheck} label="Submitted" value={stats.submitted} tone="violet" />
        <Metric icon={CheckCircle2} label="Approved" value={stats.approved} tone="emerald" />
        <Metric icon={XCircle} label="Rejected" value={stats.rejected} tone="rose" />
        <Metric icon={Gauge} label="Completion Progress" value={`${stats.completion}%`} tone="cyan" />
      </MetricGrid>
      <DashboardGrid>
        <Panel title="Recent Activity" icon={Activity}><ActivityList items={recentActivity} /></Panel>
        <Panel title="Upcoming Teaching Schedule" icon={CalendarDays}><ScheduleList lessons={upcoming} /></Panel>
        <Panel title="Completion Progress" icon={TrendingUp}><ProgressStack stats={stats} /></Panel>
        <Panel title="Quick Actions" icon={Sparkles}>
          <ActionGrid
            actions={[
              { label: "New Lesson Plan", icon: Plus, onClick: () => navigate(`/editor/${createLesson().id}`) },
              { label: "View Drafts", icon: FileText, onClick: () => navigate("/plans?status=draft") },
              { label: "Submitted Plans", icon: ClipboardCheck, onClick: () => navigate("/plans?status=submitted") },
              { label: "Curriculum", icon: BookOpen, onClick: () => navigate("/curriculum") }
            ]}
          />
        </Panel>
      </DashboardGrid>
    </>
  );
};

const HodDashboard = ({ context }: { context: DashboardContext }) => {
  const { lessons, users, currentUser, stats, recentActivity, navigate } = context;
  const departmentTeachers = users.filter((user) => user.role === "teacher" && (user.department === currentUser.department || user.subjects.some((subject) => currentUser.subjects.includes(subject))));
  const teachersWithSubmitted = new Set(lessons.filter((lesson) => ["submitted", "under-review", "approved", "final-approved", "published"].includes(lesson.status)).map((lesson) => lesson.ownerId));
  const pendingTeachers = departmentTeachers.filter((teacher) => !teachersWithSubmitted.has(teacher.id));

  return (
    <>
      <MetricGrid>
        <Metric icon={Layers3} label="Department Lesson Plans" value={lessons.length} tone="cyan" />
        <Metric icon={Clock3} label="Submitted for Review" value={stats.submitted} tone="amber" />
        <Metric icon={CheckCircle2} label="Approved" value={stats.approved} tone="emerald" />
        <Metric icon={XCircle} label="Rejected" value={stats.rejected} tone="rose" />
        <Metric icon={Users} label="Teachers Pending Submission" value={pendingTeachers.length} tone="violet" />
        <Metric icon={Gauge} label="Curriculum Progress" value={`${stats.curriculum}%`} tone="cyan" />
      </MetricGrid>
      <DashboardGrid>
        <Panel title="Curriculum Progress" icon={BookOpen}><ProgressStack stats={stats} /></Panel>
        <Panel title="Review Activity" icon={ClipboardCheck}><ActivityList items={recentActivity} /></Panel>
        <Panel title="Teachers Pending Submission" icon={Users}>
          <CompactList items={pendingTeachers.map((teacher) => ({ title: teacher.name, detail: `${teacher.department} - ${teacher.gradeClasses.join(", ") || "No classes assigned"}` }))} empty="No pending teacher submissions." />
        </Panel>
        <Panel title="Department Shortcuts" icon={Sparkles}>
          <ActionGrid
            actions={[
              { label: "Review Queue", icon: Clock3, onClick: () => navigate("/plans?status=submitted") },
              { label: "Approved Plans", icon: FileCheck2, onClick: () => navigate("/plans?status=approved") },
              { label: "Curriculum", icon: BookOpen, onClick: () => navigate("/curriculum") },
              { label: "All Plans", icon: FileText, onClick: () => navigate("/plans") }
            ]}
          />
        </Panel>
      </DashboardGrid>
    </>
  );
};

const PrincipalDashboard = ({ context }: { context: DashboardContext }) => {
  const { lessons, users, stats, recentActivity, navigate } = context;
  const departments = buildDepartmentPerformance(lessons);
  const activeTeachers = users.filter((user) => user.role === "teacher" && user.status === "active").length;

  return (
    <>
      <MetricGrid>
        <Metric icon={FileText} label="All Lesson Plans" value={lessons.length} tone="cyan" />
        <Metric icon={BarChart3} label="Approval Statistics" value={`${stats.approvalRate}%`} tone="emerald" />
        <Metric icon={UserCheck} label="Teacher Activity" value={activeTeachers} tone="violet" />
        <Metric icon={Gauge} label="Term Progress" value={`${stats.termProgress}%`} tone="amber" />
        <Metric icon={InspectionIcon} label="Inspection Readiness" value={`${stats.readiness}%`} tone="emerald" />
      </MetricGrid>
      <DashboardGrid wide>
        <Panel title="Department Performance" icon={BarChart3}><DepartmentPerformance departments={departments} /></Panel>
        <Panel title="Approval Statistics" icon={ClipboardCheck}><ApprovalStats stats={stats} /></Panel>
        <Panel title="Teacher Activity" icon={Users}><ActivityList items={recentActivity} /></Panel>
        <Panel title="Inspection Readiness" icon={ShieldCheck}>
          <ReadinessPanel stats={stats} />
          <ActionGrid actions={[{ label: "Review All Plans", icon: FileText, onClick: () => navigate("/plans") }, { label: "Curriculum Audit", icon: BookOpen, onClick: () => navigate("/curriculum") }]} />
        </Panel>
      </DashboardGrid>
    </>
  );
};

const AdministratorDashboard = ({ context }: { context: DashboardContext }) => {
  const { lessons, users, stats, recentActivity, navigate } = context;
  const roles = Object.entries(groupCount(users, "role"));
  const storageKb = Math.max(1, Math.round(JSON.stringify({ lessons, users }).length / 1024));

  return (
    <>
      <MetricGrid>
        <Metric icon={Users} label="Users" value={users.length} tone="cyan" />
        <Metric icon={ShieldCheck} label="Roles" value={roles.length} tone="violet" />
        <Metric icon={Activity} label="System Activity" value={recentActivity.length} tone="amber" />
        <Metric icon={Database} label="Data Overview" value={lessons.length} tone="emerald" />
        <Metric icon={HardDrive} label="Storage Overview" value={`${storageKb} KB`} tone="slate" />
      </MetricGrid>
      <DashboardGrid>
        <Panel title="Users & Roles" icon={Users}>
          <CompactList items={roles.map(([role, count]) => ({ title: roleLabels[role as keyof typeof roleLabels], detail: `${count} active profile${count > 1 ? "s" : ""}` }))} />
        </Panel>
        <Panel title="System Activity" icon={Activity}><ActivityList items={recentActivity} /></Panel>
        <Panel title="Data Overview" icon={Database}><ProgressStack stats={stats} /></Panel>
        <Panel title="Configuration Shortcuts" icon={Settings}>
          <ActionGrid
            actions={[
              { label: "Manage Plans", icon: FileText, onClick: () => navigate("/plans") },
              { label: "Curriculum Data", icon: BookOpen, onClick: () => navigate("/curriculum") },
              { label: "Approval Queue", icon: ClipboardCheck, onClick: () => navigate("/plans?status=submitted") },
              { label: "Archive Review", icon: Archive, onClick: () => navigate("/plans?status=archived") }
            ]}
          />
        </Panel>
      </DashboardGrid>
    </>
  );
};

const MetricGrid = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{children}</div>;

const DashboardGrid = ({ children, wide = false }: { children: ReactNode; wide?: boolean }) => (
  <div className={`grid min-w-0 gap-5 ${wide ? "xl:grid-cols-2" : "xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]"}`}>{children}</div>
);

const Metric = ({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string | number; tone: MetricTone }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="min-h-[132px] p-5">
      <Icon className={`mb-4 ${toneClass(tone)}`} size={22} />
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  </motion.div>
);

const Panel = ({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) => (
  <Card className="p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-xl font-bold text-white"><Icon className="shrink-0 text-cyan-300" size={20} /> <span className="truncate">{title}</span></h2>
    </div>
    {children}
  </Card>
);

const ActivityList = ({ items }: { items: ActivityItem[] }) => (
  <div className="divide-y divide-cyan-300/10">
    {items.length === 0 && <p className="py-8 text-sm text-muted-foreground">No activity yet.</p>}
    {items.map((item) => (
      <div key={item.id} className="py-3">
        <p className="font-semibold text-white">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.detail}</p>
        <p className="mt-1 text-[11px] font-bold uppercase text-cyan-200">{formatDate(item.timestamp)}</p>
      </div>
    ))}
  </div>
);

const ScheduleList = ({ lessons }: { lessons: LessonPlan[] }) => (
  <div className="space-y-3">
    {lessons.length === 0 && <p className="py-8 text-sm text-muted-foreground">No upcoming lessons scheduled.</p>}
    {lessons.map((lesson) => (
      <div key={lesson.id} className="rounded-md border border-cyan-300/15 bg-white/[0.04] p-3">
        <p className="font-bold text-white">{lesson.topic || "Untitled Lesson"}</p>
        <p className="text-sm text-muted-foreground">{lesson.subject || "Subject"} - {lesson.gradeClass || "Grade"} - {formatDate(lesson.date)}</p>
      </div>
    ))}
  </div>
);

const ProgressStack = ({ stats }: { stats: ReturnType<typeof buildStats> }) => (
  <div className="space-y-3 text-sm">
    <Bar label="Completion Progress" value={stats.completion} />
    <Bar label="Approval Rate" value={stats.approvalRate} />
    <Bar label="Curriculum Progress" value={stats.curriculum} />
    <Bar label="Term Progress" value={stats.termProgress} />
  </div>
);

const ApprovalStats = ({ stats }: { stats: ReturnType<typeof buildStats> }) => (
  <div className="grid gap-3 sm:grid-cols-3">
    <SmallStat label="Approved" value={stats.approved} tone="emerald" />
    <SmallStat label="In Review" value={stats.submitted} tone="amber" />
    <SmallStat label="Rejected / Revision" value={stats.rejected} tone="rose" />
  </div>
);

const ReadinessPanel = ({ stats }: { stats: ReturnType<typeof buildStats> }) => (
  <div className="mb-4 rounded-md border border-emerald-300/20 bg-emerald-500/10 p-4">
    <p className="text-4xl font-black text-white">{stats.readiness}%</p>
    <p className="mt-1 text-sm text-muted-foreground">Inspection readiness blends approval rate, curriculum coverage, and live submission progress.</p>
  </div>
);

const DepartmentPerformance = ({ departments }: { departments: { department: string; total: number; approved: number; progress: number }[] }) => (
  <div className="space-y-3">
    {departments.length === 0 && <p className="py-8 text-sm text-muted-foreground">No department data yet.</p>}
    {departments.map((item) => (
      <div key={item.department} className="rounded-md border border-cyan-300/15 bg-white/[0.04] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-white">{item.department}</p>
          <p className="text-sm font-black text-cyan-200">{item.approved}/{item.total} approved</p>
        </div>
        <Bar label="Performance" value={item.progress} />
      </div>
    ))}
  </div>
);

const CompactList = ({ items, empty = "No records to show." }: { items: { title: string; detail: string }[]; empty?: string }) => (
  <div className="space-y-2">
    {items.length === 0 && <p className="py-8 text-sm text-muted-foreground">{empty}</p>}
    {items.map((item) => (
      <div key={`${item.title}-${item.detail}`} className="rounded-md border border-cyan-300/15 bg-white/[0.04] px-3 py-2">
        <p className="font-bold text-white">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.detail}</p>
      </div>
    ))}
  </div>
);

const ActionGrid = ({ actions }: { actions: { label: string; icon: LucideIcon; onClick: () => void }[] }) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {actions.map(({ label, icon: Icon, onClick }) => (
      <button key={label} className="flex min-h-16 items-center gap-3 rounded-md border border-cyan-300/15 bg-white/[0.04] px-3 py-3 text-left font-bold text-white transition hover:border-cyan-300/35 hover:bg-cyan-500/10" onClick={onClick}>
        <Icon className="shrink-0 text-cyan-300" size={18} />
        <span>{label}</span>
      </button>
    ))}
  </div>
);

const SmallStat = ({ label, value, tone }: { label: string; value: number; tone: MetricTone }) => (
  <div className="rounded-md border border-cyan-300/15 bg-white/[0.04] p-3">
    <p className={`text-2xl font-black ${toneClass(tone)}`}>{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const Bar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="font-bold text-cyan-200">{value}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
      <motion.div className="h-full rounded-full bg-cyan-300" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.5 }} />
    </div>
  </div>
);

const buildStats = (lessons: LessonPlan[]) => {
  const total = lessons.length;
  const draft = countStatus(lessons, ["draft"]);
  const submitted = countStatus(lessons, submittedStatuses);
  const approved = countStatus(lessons, reviewedStatuses);
  const rejected = countStatus(lessons, rejectedStatuses);
  const completion = total ? Math.round(((total - draft) / total) * 100) : 0;
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;
  const curriculum = total ? Math.round((lessons.filter((lesson) => lesson.weeklyPlan?.some((day) => day.lesson && day.objectives)).length / total) * 100) : 0;
  const termProgress = total ? Math.min(100, Math.round(((approved + submitted) / total) * 100)) : 0;
  const readiness = Math.round((approvalRate * 0.45) + (curriculum * 0.35) + (completion * 0.2));
  return { total, draft, submitted, approved, rejected, completion, approvalRate, curriculum, termProgress, readiness };
};

const countStatus = (lessons: LessonPlan[], statuses: LessonStatus[]) => lessons.filter((lesson) => statuses.includes(lesson.status)).length;

const buildRecentActivity = (lessons: LessonPlan[]) =>
  lessons
    .flatMap((lesson) =>
      (lesson.activityLogs?.length ? lesson.activityLogs : [{ id: `${lesson.id}-updated`, description: "Lesson plan updated", timestamp: lesson.updatedAt, userName: lesson.ownerName }]).map((log) => ({
        id: `${lesson.id}-${log.id}`,
        title: lesson.topic || lesson.lessonNumber || "Untitled Lesson",
        detail: `${log.userName}: ${log.description}`,
        timestamp: log.timestamp
      }))
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6);

const buildUpcomingLessons = (lessons: LessonPlan[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return lessons
    .filter((lesson) => lesson.date && new Date(`${lesson.date}T00:00:00`).getTime() >= today.getTime())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
};

const buildDepartmentPerformance = (lessons: LessonPlan[]) =>
  Object.entries(groupBy(lessons, (lesson) => lesson.department || "Unassigned"))
    .map(([department, items]) => {
      const approved = countStatus(items, reviewedStatuses);
      return { department, total: items.length, approved, progress: items.length ? Math.round((approved / items.length) * 100) : 0 };
    })
    .sort((a, b) => b.progress - a.progress || b.total - a.total)
    .slice(0, 6);

const buildCalendar = (today: Date, lessons: LessonPlan[]) => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long" }).format(today);
  return {
    year,
    monthLabel,
    plannedCount: lessons.filter((lesson) => {
      if (!lesson.date) return false;
      const date = new Date(`${lesson.date}T00:00:00`);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length
  };
};

const groupBy = <T,>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, T[]>>((groups, item) => {
    const groupKey = key(item);
    groups[groupKey] = [...(groups[groupKey] || []), item];
    return groups;
  }, {});

const groupCount = <T, K extends keyof T>(items: T[], key: K) =>
  items.reduce<Record<string, number>>((groups, item) => {
    const value = String(item[key] || "unknown");
    groups[value] = (groups[value] || 0) + 1;
    return groups;
  }, {});

const formatDate = (value?: string) => {
  if (!value) return "No date";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

const toneClass = (tone: MetricTone) => {
  const tones: Record<MetricTone, string> = {
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
    violet: "text-violet-300",
    slate: "text-slate-300"
  };
  return tones[tone];
};

const InspectionIcon = GraduationCap;
