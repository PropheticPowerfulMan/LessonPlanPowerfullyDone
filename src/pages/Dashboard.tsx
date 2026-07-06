import { motion } from "framer-motion";
import { BookOpen, CalendarDays, Clock3, FileText, Plus, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-xl border shadow-premium">
        <img src={imageUrl} alt="School banner" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent" />
        <div className="relative grid gap-6 p-6 text-white md:grid-cols-[1.3fr_0.7fr] md:p-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">International American School</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight md:text-6xl">Powerful Lesson Planner</h1>
            <p className="mt-3 max-w-2xl text-white/85">Create polished, printable, standards-ready lesson plans with version history, templates, exports, and school-branded documents.</p>
          </motion.div>
          <div className="flex items-end justify-start md:justify-end">
            <Button
              className="h-12 px-5"
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

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={FileText} label="Total Lesson Plans" value={lessons.length} />
        <Metric icon={BookOpen} label="Active Plans" value={active.length} />
        <Metric icon={TrendingUp} label="Subjects" value={subjects} />
        <Metric icon={Clock3} label="Active Ratio" value={`${completion}%`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Recent Lesson Plans</h2>
            <Input className="max-w-xs" placeholder="Quick search..." onChange={(event) => navigate(`/plans?q=${encodeURIComponent(event.target.value)}`)} />
          </div>
          <div className="divide-y">
            {recent.length === 0 && <p className="py-8 text-sm text-muted-foreground">No lesson plans yet. Start with the prominent button above.</p>}
            {recent.map((lesson) => (
              <button key={lesson.id} className="grid w-full gap-1 py-4 text-left hover:text-primary" onClick={() => navigate(`/editor/${lesson.id}`)}>
                <span className="font-semibold">{lesson.topic || "Untitled Lesson"}</span>
                <span className="text-sm text-muted-foreground">
                  {lesson.subject || "Subject"} · {lesson.gradeClass || "Grade"} · Modified {new Date(lesson.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-xl font-bold">Calendar</h2>
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
            {Array.from({ length: 35 }, (_, index) => {
              const day = index + 1;
              const planned = lessons.some((lesson) => new Date(lesson.date).getDate() === day);
              return (
                <span key={day} className={`rounded-lg py-3 font-semibold ${planned ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {day <= 31 ? day : ""}
                </span>
              );
            })}
          </div>
          <h2 className="mb-3 mt-6 text-xl font-bold">Statistics</h2>
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
    <Icon className="mb-4 text-primary" size={22} />
    <p className="text-3xl font-black">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </Card>
);

const Bar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex justify-between">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  </div>
);
