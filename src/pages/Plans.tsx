import { Archive, CheckCircle2, Copy, Download, Edit3, FileJson, RefreshCcw, Send, Trash2, Upload, XCircle } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input, Select } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { createBlankLesson } from "../data/defaults";
import { filterLessons, lessonRepository } from "../services/lessonRepository";
import { applyLessonVisibility, canDeleteLesson, canEditLesson, canReviewLesson } from "../services/permissions";
import { LessonFilters, LessonPlan, LessonStatus } from "../types/lesson";

const lessonStatuses: LessonStatus[] = ["draft", "submitted", "under-review", "approved", "rejected", "archived", "published"];

const initialFilters: LessonFilters = {
  query: "",
  teacher: "",
  subject: "",
  grade: "",
  date: "",
  topic: "",
  week: "",
  month: "",
  year: "",
  term: "",
  tags: "",
  status: "all"
};

export const Plans = () => {
  const { currentUser, can } = useAuth();
  const [lessons, setLessons] = useState(() => applyLessonVisibility(currentUser, lessonRepository.list()));
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<LessonFilters>({ ...initialFilters, query: searchParams.get("q") || "" });
  const navigate = useNavigate();
  const { notify } = useToast();
  const filtered = useMemo(() => filterLessons(lessons, filters), [lessons, filters]);

  const patch = (key: keyof LessonFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const refresh = () => {
    const source = showDeleted ? lessonRepository.listAll() : lessonRepository.list();
    setLessons(applyLessonVisibility(currentUser, source));
  };

  useEffect(() => {
    refresh();
  }, [currentUser, showDeleted]);

  const duplicate = (lesson: LessonPlan) => {
    if (!currentUser) return;
    lessonRepository.duplicate(lesson, currentUser, createBlankLesson(`LP-${new Date().getFullYear()}-${lessons.length + 1}`).lessonNumber);
    refresh();
    notify("Lesson plan duplicated");
  };

  const setStatus = (lesson: LessonPlan, status: LessonStatus, description?: string) => {
    lessonRepository.changeStatus(lesson.id, status, currentUser, description);
    refresh();
    notify(`Status updated to ${statusLabel(status)}`);
  };

  const softDelete = (lesson: LessonPlan) => {
    if (!confirm("Move this lesson plan to deleted items?")) return;
    lessonRepository.softDelete(lesson.id, currentUser);
    refresh();
    notify("Lesson plan moved to deleted items");
  };

  const restore = (lesson: LessonPlan) => {
    lessonRepository.restore(lesson.id, currentUser);
    refresh();
    notify("Lesson plan restored");
  };

  const downloadBackup = () => {
    const blob = new Blob([lessonRepository.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kcs-lesson-planner-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      lessonRepository.import(JSON.parse(text) as LessonPlan[]);
      refresh();
      notify("JSON backup imported");
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">Lesson Plans</h1>
          <p className="text-sm text-muted-foreground">Search, filter, review, archive, restore, duplicate, and back up your local library.</p>
        </div>
        {can("backup:manage") && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadBackup}>
              <Download size={17} /> Export JSON
            </Button>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-cyan-300/25 bg-white/[0.06] px-4 text-sm font-bold text-foreground hover:bg-cyan-500/15">
              <Upload size={17} /> Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={importBackup} />
            </label>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Field label="Keywords"><Input value={filters.query} onChange={(e) => patch("query", e.target.value)} placeholder="topic, objective..." /></Field>
          <Field label="Teacher"><Input value={filters.teacher} onChange={(e) => patch("teacher", e.target.value)} /></Field>
          <Field label="Subject"><Input value={filters.subject} onChange={(e) => patch("subject", e.target.value)} /></Field>
          <Field label="Grade"><Input value={filters.grade} onChange={(e) => patch("grade", e.target.value)} /></Field>
          <Field label="Date"><Input type="date" value={filters.date} onChange={(e) => patch("date", e.target.value)} /></Field>
          <Field label="Term"><Input value={filters.term} onChange={(e) => patch("term", e.target.value)} /></Field>
          <Field label="Week"><Input value={filters.week} onChange={(e) => patch("week", e.target.value)} /></Field>
          <Field label="Month"><Input value={filters.month} onChange={(e) => patch("month", e.target.value)} placeholder="1-12" /></Field>
          <Field label="Year"><Input value={filters.year} onChange={(e) => patch("year", e.target.value)} /></Field>
          <Field label="Topic"><Input value={filters.topic} onChange={(e) => patch("topic", e.target.value)} /></Field>
          <Field label="Tags"><Input value={filters.tags} onChange={(e) => patch("tags", e.target.value)} placeholder="comma tags" /></Field>
          <Field label="Status">
            <Select value={filters.status} onChange={(e) => patch("status", e.target.value)}>
              <option value="all">All</option>
              {lessonStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </Select>
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm font-bold text-muted-foreground">
            <input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} />
            Show deleted
          </label>
        </div>
      </Card>

      <div className="grid gap-3">
        {filtered.map((lesson) => (
          <Card key={lesson.id} className="grid min-w-0 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="font-bold text-white">{lesson.topic || "Untitled Lesson"}</p>
              <p className="text-sm text-muted-foreground">{lesson.lessonNumber} - {lesson.subject || "Subject"} - {lesson.gradeClass || "Grade"} - {lesson.date}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={lesson.status} />
                {lesson.deletedAt && <span className="rounded-full border border-red-400/35 bg-red-500/15 px-2 py-1 text-xs font-bold text-red-100">Deleted</span>}
                {lesson.tags.map((tag) => <span key={tag} className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-100">{tag}</span>)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Last update: {new Date(lesson.updatedAt).toLocaleString()} - {lesson.activityLogs?.[0]?.description || "No activity yet"}</p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
              {!lesson.deletedAt && <Button variant="outline" onClick={() => navigate(`/editor/${lesson.id}`)}><Edit3 size={16} /> {canEditLesson(currentUser, lesson) ? "Edit" : "Open"}</Button>}
              {!lesson.deletedAt && can("lesson:create") && <Button variant="outline" onClick={() => duplicate(lesson)}><Copy size={16} /> Duplicate</Button>}
              {!lesson.deletedAt && canEditLesson(currentUser, lesson) && lesson.status === "draft" && <Button variant="outline" onClick={() => setStatus(lesson, "submitted", "Submitted for review")}><Send size={16} /> Submit</Button>}
              {!lesson.deletedAt && canReviewLesson(currentUser, lesson) && lesson.status === "submitted" && <Button variant="outline" onClick={() => setStatus(lesson, "under-review", "Review started")}><RefreshCcw size={16} /> Review</Button>}
              {!lesson.deletedAt && (canReviewLesson(currentUser, lesson) || can("lesson:update:any")) && ["submitted", "under-review"].includes(lesson.status) && <Button variant="outline" onClick={() => setStatus(lesson, "approved", "Lesson plan approved")}><CheckCircle2 size={16} /> Approve</Button>}
              {!lesson.deletedAt && (canReviewLesson(currentUser, lesson) || can("lesson:update:any")) && ["submitted", "under-review"].includes(lesson.status) && <Button variant="danger" onClick={() => setStatus(lesson, "rejected", "Lesson plan rejected")}><XCircle size={16} /> Reject</Button>}
              {!lesson.deletedAt && can("lesson:update:any") && lesson.status === "approved" && <Button variant="outline" onClick={() => setStatus(lesson, "published", "Lesson plan published")}><CheckCircle2 size={16} /> Publish</Button>}
              {!lesson.deletedAt && canEditLesson(currentUser, lesson) && <Button variant="outline" onClick={() => setStatus(lesson, lesson.status === "archived" ? "draft" : "archived", lesson.status === "archived" ? "Lesson plan unarchived" : "Lesson plan archived")}><Archive size={16} /> {lesson.status === "archived" ? "Unarchive" : "Archive"}</Button>}
              {lesson.deletedAt && canDeleteLesson(currentUser, lesson) && <Button variant="outline" onClick={() => restore(lesson)}><RefreshCcw size={16} /> Restore</Button>}
              {!lesson.deletedAt && canDeleteLesson(currentUser, lesson) && <Button variant="danger" onClick={() => softDelete(lesson)}><Trash2 size={16} /> Delete</Button>}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card className="p-8 text-center text-muted-foreground"><FileJson className="mx-auto mb-2" /> No plans match the current filters.</Card>}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    {children}
  </div>
);

const statusLabel = (status: LessonStatus) => ({
  draft: "Draft",
  submitted: "Submitted",
  "under-review": "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
  published: "Published"
})[status];

const StatusBadge = ({ status }: { status: LessonStatus }) => {
  const styles: Record<LessonStatus, string> = {
    draft: "border-slate-400/30 bg-slate-500/15 text-slate-100",
    submitted: "border-sky-300/35 bg-sky-500/15 text-sky-100",
    "under-review": "border-amber-300/35 bg-amber-500/15 text-amber-100",
    approved: "border-emerald-300/35 bg-emerald-500/15 text-emerald-100",
    rejected: "border-red-300/35 bg-red-500/15 text-red-100",
    archived: "border-zinc-300/35 bg-zinc-500/15 text-zinc-100",
    published: "border-cyan-300/35 bg-cyan-500/15 text-cyan-100"
  };

  return <span className={`rounded-full border px-2 py-1 text-xs font-bold ${styles[status]}`}>{statusLabel(status)}</span>;
};
