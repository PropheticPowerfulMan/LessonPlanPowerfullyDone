import { motion } from "framer-motion";
import { BookOpen, CalendarDays, CheckCircle2, Clock3, FileText, Plus, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { schoolDisplayName } from "../data/defaults";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useApp } from "../contexts/AppContext";
import { useLessons } from "../hooks/useLessons";

export const Dashboard = () => {
  const { imageUrl } = useApp();
  const { lessons, createLesson } = useLessons();
  const navigate = useNavigate();
  const active = lessons.filter((lesson) => lesson.status === "active");
  const recent = [...lessons].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const subjects = new Set(lessons.map((lesson) => lesson.subject).filter(Boolean)).size;
  const completion = lessons.length ? Math.round((active.length / lessons.length) * 100) : 0;
  const calendar = useMemo(() => buildCalendar(new Date(), lessons), [lessons]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-lg border border-cyan-300/20 bg-[#061520]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,222,0.20),transparent_32%,rgba(16,185,129,0.12)_70%,rgba(251,191,36,0.10))]" />
        <div className="relative grid gap-6 p-5 text-white md:grid-cols-[1.3fr_0.7fr] md:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="badge">{schoolDisplayName}</span>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-[#f8fdff] drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] md:text-4xl xl:text-5xl">KCS Lesson Planner</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50/80">Create polished, printable lesson plans for KCS and Kinshasa Christian School with ready-made templates, exports, and version history.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-cyan-100">
              <span className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-white/[0.06] px-3 py-2"><CheckCircle2 size={15} /> Autosave</span>
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-500/10 px-3 py-2"><FileText size={15} /> Print-ready</span>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FileText} label="Total Lesson Plans" value={lessons.length} />
        <Metric icon={BookOpen} label="Active Plans" value={active.length} />
        <Metric icon={TrendingUp} label="Subjects" value={subjects} />
        <Metric icon={Clock3} label="Active Ratio" value={`${completion}%`} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white">Recent Lesson Plans</h2>
            <Input className="max-w-xs" placeholder="Quick search..." onChange={(event) => navigate(`/plans?q=${encodeURIComponent(event.target.value)}`)} />
          </div>
          <div className="divide-y divide-cyan-300/10">
            {recent.length === 0 && <p className="py-8 text-sm text-muted-foreground">No lesson plans yet. Start with the prominent button above.</p>}
            {recent.map((lesson) => (
              <button key={lesson.id} className="grid w-full gap-1 py-4 text-left hover:text-cyan-200" onClick={() => navigate(`/editor/${lesson.id}`)}>
                <span className="font-semibold">{lesson.topic || "Untitled Lesson"}</span>
                <span className="text-sm text-muted-foreground">
                  {lesson.subject || "Subject"} · {lesson.gradeClass || "Grade"} · Modified {new Date(lesson.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase text-cyan-200"><CalendarDays size={15} /> Calendrier précis</p>
              <h2 className="mt-1 text-xl font-bold capitalize text-white">{calendar.monthLabel} {calendar.year}</h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">Aujourd'hui : {calendar.todayLabel}</p>
            </div>
            <span className="rounded-md border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100">
              {calendar.plannedCount} plan{calendar.plannedCount > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid min-w-0 grid-cols-7 gap-1 text-center text-[9px] sm:gap-2 sm:text-xs">
            {calendar.weekdays.map((day) => (
              <span key={day} className="min-w-0 truncate rounded-md border border-cyan-300/10 bg-white/[0.04] px-0.5 py-2 font-bold uppercase leading-none text-muted-foreground">{day}</span>
            ))}
            {calendar.cells.map((cell, index) => (
              <div
                key={`${cell.iso || "blank"}-${index}`}
                className={`min-h-14 rounded-md border p-1 text-left transition sm:min-h-16 sm:p-2 ${cell.inMonth ? "border-cyan-300/12 bg-white/[0.055]" : "border-transparent bg-transparent"} ${cell.isToday ? "border-red-600 bg-red-600 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.45)]" : ""} ${cell.plans.length && !cell.isToday ? "bg-cyan-300 text-slate-950" : ""}`}
              >
                {cell.inMonth && (
                  <>
                    <p className={`text-sm font-black ${cell.isToday ? "text-[#fff]" : ""}`}>{cell.dayNumber}</p>
                    <p className={`mt-1 hidden truncate text-[10px] capitalize sm:block ${cell.isToday ? "text-[#fff]/90" : cell.plans.length ? "text-slate-800" : "text-muted-foreground"}`}>{cell.weekdayLong}</p>
                    {cell.plans.length > 0 && <p className={`mt-1 truncate text-[9px] font-bold sm:text-[10px] ${cell.isToday ? "text-[#fff]" : ""}`}>{cell.plans.length} plan</p>}
                  </>
                )}
              </div>
            ))}
          </div>
          <h2 className="mb-3 mt-6 text-xl font-bold text-white">Statistics</h2>
          <div className="space-y-3 text-sm">
            <Bar label="Recently Modified" value={recent.length ? 80 : 0} />
            <Bar label="Archived" value={lessons.length ? Math.round((lessons.filter((lesson) => lesson.status === "archived").length / lessons.length) * 100) : 0} />
            <Bar label="Template Coverage" value={lessons.length ? 100 : 0} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string | number }) => (
  <Card className="p-5">
    <Icon className="mb-4 text-cyan-300" size={22} />
    <p className="text-3xl font-black text-white">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </Card>
);

const buildCalendar = (today: Date, lessons: ReturnType<typeof useLessons>["lessons"]) => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(today);
  const todayIso = toIsoDate(today);
  const weekdays = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
  const plannedByDate = new Map<string, typeof lessons>();

  lessons.forEach((lesson) => {
    if (!lesson.date) return;
    const iso = toIsoDate(new Date(`${lesson.date}T00:00:00`));
    plannedByDate.set(iso, [...(plannedByDate.get(iso) || []), lesson]);
  });

  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return { inMonth: false, iso: "", dayNumber: "", weekdayLong: "", plans: [], isToday: false };
    }

    const date = new Date(year, month, dayNumber);
    const iso = toIsoDate(date);
    return {
      inMonth: true,
      iso,
      dayNumber: String(dayNumber),
      weekdayLong: new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date),
      plans: plannedByDate.get(iso) || [],
      isToday: iso === todayIso
    };
  });

  return {
    year,
    monthLabel,
    todayLabel: new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(today),
    weekdays,
    cells,
    plannedCount: lessons.filter((lesson) => {
      if (!lesson.date) return false;
      const date = new Date(`${lesson.date}T00:00:00`);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length
  };
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Bar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex justify-between">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-white/[0.07]">
      <div className="h-full rounded-full bg-cyan-300" style={{ width: `${value}%` }} />
    </div>
  </div>
);
