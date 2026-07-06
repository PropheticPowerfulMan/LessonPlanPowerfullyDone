import { Archive, Copy, Download, Edit3, FileJson, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input, Select } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/Toast";
import { createBlankLesson } from "../data/defaults";
import { filterLessons, lessonRepository } from "../services/lessonRepository";
import { LessonFilters, LessonPlan } from "../types/lesson";

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
  const [lessons, setLessons] = useState(() => lessonRepository.list());
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<LessonFilters>({ ...initialFilters, query: searchParams.get("q") || "" });
  const navigate = useNavigate();
  const { notify } = useToast();
  const filtered = useMemo(() => filterLessons(lessons, filters), [lessons, filters]);

  const patch = (key: keyof LessonFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const refresh = () => setLessons(lessonRepository.list());

  const duplicate = (lesson: LessonPlan) => {
    const now = new Date().toISOString();
    const copy = { ...lesson, id: crypto.randomUUID(), lessonNumber: createBlankLesson(`LP-${new Date().getFullYear()}-${lessons.length + 1}`).lessonNumber, topic: `${lesson.topic} (Copy)`, createdAt: now, updatedAt: now, versions: [] };
    lessonRepository.save(copy);
    refresh();
    notify("Lesson plan duplicated");
  };

  const downloadBackup = () => {
    const blob = new Blob([lessonRepository.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "powerful-lesson-planner-backup.json";
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
          <h1 className="text-3xl font-black">Lesson Plans</h1>
          <p className="text-sm text-muted-foreground">Search, filter, archive, duplicate, and back up your local library.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadBackup}>
            <Download size={17} /> Export JSON
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-card px-4 text-sm font-semibold hover:bg-muted">
            <Upload size={17} /> Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importBackup} />
          </label>
        </div>
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
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="grid gap-3">
        {filtered.map((lesson) => (
          <Card key={lesson.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-bold">{lesson.topic || "Untitled Lesson"}</p>
              <p className="text-sm text-muted-foreground">{lesson.lessonNumber} · {lesson.subject || "Subject"} · {lesson.gradeClass || "Grade"} · {lesson.date}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lesson.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{tag}</span>)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/editor/${lesson.id}`)}><Edit3 size={16} /> Edit</Button>
              <Button variant="outline" onClick={() => duplicate(lesson)}><Copy size={16} /> Duplicate</Button>
              <Button variant="outline" onClick={() => { lessonRepository.save({ ...lesson, status: lesson.status === "archived" ? "active" : "archived", updatedAt: new Date().toISOString() }); refresh(); }}><Archive size={16} /> {lesson.status === "archived" ? "Restore" : "Archive"}</Button>
              <Button variant="danger" onClick={() => { if (confirm("Delete this lesson plan permanently?")) { lessonRepository.remove(lesson.id); refresh(); notify("Lesson plan deleted"); } }}><Trash2 size={16} /></Button>
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
