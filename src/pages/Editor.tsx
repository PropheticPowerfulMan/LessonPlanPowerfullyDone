import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Download, FileDown, Printer, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { CSSProperties, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useToast } from "../components/Toast";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog } from "../components/ui/dialog";
import { Input, Textarea } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createBlankLesson, createFlexibleWeeklyPlan, createPdfExampleWeeklyPlan, schoolDisplayName, schoolImage } from "../data/defaults";
import { useDebouncedEffect } from "../hooks/useDebouncedEffect";
import { LessonPrint } from "../print/LessonPrint";
import { lessonRepository } from "../services/lessonRepository";
import { LessonPlan, WeeklyPlanDay } from "../types/lesson";
import { exportElementToDocx, exportElementToPdf } from "../utils/export";

const schema = z.object({
  teachers: z.string().min(1, "Teacher is required"),
  subject: z.string().min(1, "Subject is required"),
  gradeClass: z.string().min(1, "Grade/Class is required"),
  chapter: z.string().min(1, "Chapter is required")
}).passthrough();

export const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [preview, setPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const lesson = useMemo(() => (id ? lessonRepository.get(id) : undefined), [id]);
  const fallback = useMemo(() => createBlankLesson(`LP-${new Date().getFullYear()}-0001`), []);

  const form = useForm<LessonPlan>({
    defaultValues: lesson || fallback,
    resolver: zodResolver(schema),
    mode: "onChange"
  });
  const values = form.watch();
  const weeklyPlan = values.weeklyPlan?.length ? values.weeklyPlan : createFlexibleWeeklyPlan(values.subject, values.gradeClass, values.chapter);
  const printableLesson = useMemo(() => toPrintableLesson(values), [values]);

  const completion = useMemo(() => {
    const required = [
      values.teachers,
      values.subject,
      values.gradeClass,
      values.chapter,
      ...weeklyPlan.flatMap((day) => [day.lesson, day.objectives, day.presentation, day.assessment])
    ];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [values, weeklyPlan]);

  const save = (withVersion = false) => {
    const current = form.getValues();
    const now = new Date().toISOString();
    const next: LessonPlan = {
      ...toPrintableLesson(current),
      updatedAt: now,
      versions: withVersion
        ? [{ id: crypto.randomUUID(), savedAt: now, summary: `Manual save: ${current.chapter || current.topic}`, snapshot: { ...current, versions: [] } }, ...(current.versions || [])].slice(0, 20)
        : current.versions || []
    };
    lessonRepository.save(next);
    if (withVersion) {
      form.reset(next);
      notify("Saved");
    }
  };

  useDebouncedEffect(() => {
    if (form.formState.isDirty) save(false);
  }, [values], 900);

  const print = useReactToPrint({ contentRef: printRef, documentTitle: printableLesson.chapter || "Weekly Lesson Plan" });

  const duplicate = () => {
    const now = new Date().toISOString();
    const copy = {
      ...form.getValues(),
      id: crypto.randomUUID(),
      lessonNumber: `LP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      createdAt: now,
      updatedAt: now,
      versions: []
    };
    lessonRepository.save(copy);
    notify("Duplicated lesson plan");
    navigate(`/editor/${copy.id}`);
  };

  const loadPdfModel = () => {
    const next = {
      ...form.getValues(),
      schoolName: schoolDisplayName,
      schoolYear: "2026 - 2027",
      semester: "1st",
      quarter: "1st",
      week: "1",
      subject: "English (Writing and Grammar)",
      gradeClass: "Grade 6",
      chapter: "Chapter 1: Sentences",
      topic: "Weekly Lesson Plan - Sentences",
      duration: "1h30",
      weeklyPlan: createPdfExampleWeeklyPlan()
    };
    form.reset(next);
    lessonRepository.save({ ...next, updatedAt: new Date().toISOString() });
    notify("PDF example loaded");
  };

  const generateWeek = () => {
    const current = form.getValues();
    const subject = current.subject || "";
    const chapter = current.chapter || current.topic || "";
    const grade = current.gradeClass || "";
    const generated: WeeklyPlanDay[] = createFlexibleWeeklyPlan(subject, grade, chapter);
    form.setValue("weeklyPlan", generated, { shouldDirty: true });
    form.setValue("topic", chapter ? `Weekly Lesson Plan - ${chapter}` : "Weekly Lesson Plan", { shouldDirty: true });
    notify("Week generated automatically");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-cyan-200">KCS weekly lesson plan</p>
          <h1 className="truncate text-2xl font-black text-white md:text-3xl">{printableLesson.chapter || printableLesson.subject || "New Lesson Plan"}</h1>
          <p className="text-sm text-muted-foreground">The KCS identity and print layout are fixed; the teaching content adapts to each course.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save(true)}><Save size={17} /> Save</Button>
          <Button variant="outline" onClick={duplicate}><Copy size={17} /> Duplicate</Button>
          <Button variant="outline" onClick={() => setPreview(true)}><Printer size={17} /> Preview</Button>
          <Button variant="outline" onClick={() => printRef.current && exportElementToPdf(printRef.current, `${printableLesson.chapter || "lesson-plan"}.pdf`)}><FileDown size={17} /> PDF</Button>
          <Button variant="outline" onClick={() => printRef.current && exportElementToDocx(printRef.current, `${printableLesson.chapter || "lesson-plan"}.docx`)}><Download size={17} /> DOCX</Button>
          <Button variant="danger" onClick={() => { if (confirm("Delete this lesson plan permanently?")) { lessonRepository.remove(values.id); navigate("/plans"); } }}><Trash2 size={17} /></Button>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${completion}%` }} /></div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form className="space-y-4" onSubmit={form.handleSubmit(() => save(true))}>
          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">1. Essential setup</h2>
                <p className="text-sm text-muted-foreground">Only the changing details are editable. KCS is already known.</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={generateWeek}><Sparkles size={17} /> Generate week</Button>
                <Button type="button" variant="outline" onClick={loadPdfModel}><RotateCcw size={17} /> Load PDF example</Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <LockedSchool />
              <Field label="Teacher"><Input {...form.register("teachers")} /></Field>
              <Field label="Subject"><Input list="subject-suggestions" {...form.register("subject")} /></Field>
              <Field label="Grade"><Input list="grade-suggestions" {...form.register("gradeClass")} /></Field>
              <Field label="Chapter / Unit"><Input {...form.register("chapter")} /></Field>
              <Field label="Week"><Input {...form.register("week")} /></Field>
              <Field label="Duration"><Input {...form.register("duration")} /></Field>
              <Field label="School Year"><Input {...form.register("schoolYear")} /></Field>
              <Field label="Quarter"><Input {...form.register("quarter")} /></Field>
            </div>
            <datalist id="subject-suggestions">
              {["Mathematics", "English", "English (Writing and Grammar)", "Science", "French", "Computer Science", "History", "Geography", "Physics", "Chemistry", "Biology", "Art", "Music", "Physical Education"].map((item) => <option key={item} value={item} />)}
            </datalist>
            <datalist id="grade-suggestions">
              {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map((item) => <option key={item} value={item} />)}
            </datalist>
          </Card>

          <Card className="p-4">
            <div className="mb-4">
              <h2 className="text-lg font-black text-white">2. Weekly grid</h2>
              <p className="text-sm text-muted-foreground">Use Generate week first, then edit only the parts that need teacher judgement.</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-5">
              {weeklyPlan.map((day, index) => (
                <div key={day.day} className="rounded-lg border border-cyan-300/15 bg-[#030d14]/70 p-3">
                  <input type="hidden" {...form.register(`weeklyPlan.${index}.day` as const)} value={day.day} readOnly />
                  <h3 className="mb-3 rounded-md border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-center text-sm font-black text-cyan-100">{day.day}</h3>
                  <div className="space-y-2">
                    <Field label="Lesson"><Textarea className="min-h-16" {...form.register(`weeklyPlan.${index}.lesson` as const)} /></Field>
                    <Field label="Objectives"><Textarea className="min-h-20" {...form.register(`weeklyPlan.${index}.objectives` as const)} /></Field>
                    <Field label="Presentation"><Textarea className="min-h-20" {...form.register(`weeklyPlan.${index}.presentation` as const)} /></Field>
                    <details>
                      <summary className="cursor-pointer rounded-md border border-cyan-300/15 px-3 py-2 text-xs font-bold text-cyan-100">More for this day</summary>
                      <div className="mt-2 space-y-2">
                        <Field label="Guided Practice"><Textarea className="min-h-16" {...form.register(`weeklyPlan.${index}.guidedPractice` as const)} /></Field>
                        <Field label="Exit Ticket"><Textarea className="min-h-16" {...form.register(`weeklyPlan.${index}.exitTicket` as const)} /></Field>
                        <Field label="Assessment"><Textarea className="min-h-16" {...form.register(`weeklyPlan.${index}.assessment` as const)} /></Field>
                        <Field label="Homework"><Textarea className="min-h-16" {...form.register(`weeklyPlan.${index}.homework` as const)} /></Field>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <details className="rounded-lg border border-cyan-300/15 bg-[#071824]/80 p-4">
            <summary className="cursor-pointer text-lg font-black text-white">Optional print notes</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Field label="Key Vocabulary"><Textarea value={values.vocabulary?.map((item) => item.value).join("; ") || ""} onChange={(e) => form.setValue("vocabulary", [{ id: "vocabulary", value: e.target.value }], { shouldDirty: true })} /></Field>
              <Field label="Materials / Resources"><Textarea value={values.materialsResources?.map((item) => item.value).join("; ") || ""} onChange={(e) => form.setValue("materialsResources", [{ id: "materials", value: e.target.value }], { shouldDirty: true })} /></Field>
              <Field label="References"><Textarea {...form.register("referenceBook")} /></Field>
              <Field label="Differentiation"><Textarea {...form.register("differentiation.inclusiveStrategies")} /></Field>
              <Field label="Assessment Notes"><Textarea {...form.register("assessment.teacherComments")} /></Field>
              <Field label="Reflection"><Textarea {...form.register("reflection.teacherNotes")} /></Field>
            </div>
          </details>
        </form>

        <aside className="space-y-4">
          <Card className="sticky top-24 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Print preview</h2>
                <p className="text-xs text-muted-foreground">Scaled to fit the screen.</p>
              </div>
              <Button type="button" onClick={print}><Printer size={16} /> Print</Button>
            </div>
            <PrintPreview lesson={printableLesson} zoom={0.34} />
          </Card>
        </aside>
      </div>

      <div aria-hidden className="fixed left-[-12000px] top-0">
        <LessonPrint lesson={printableLesson} ref={printRef} />
      </div>

      <Dialog open={preview} title="Weekly Lesson Plan Preview" onClose={() => setPreview(false)}>
        <div className="mb-4 flex justify-end gap-2">
          <Button onClick={print}><Printer size={17} /> Print</Button>
          <Button variant="outline" onClick={() => printRef.current && exportElementToPdf(printRef.current, `${printableLesson.chapter || "lesson-plan"}.pdf`)}><FileDown size={17} /> PDF</Button>
        </div>
        <PrintPreview lesson={printableLesson} zoom={0.68} />
      </Dialog>
    </div>
  );
};

const toPrintableLesson = (lesson: LessonPlan): LessonPlan => {
  const subject = lesson.subject || "";
  const gradeClass = lesson.gradeClass || "";
  const chapter = lesson.chapter || lesson.topic || "";

  return {
    ...lesson,
    schoolName: schoolDisplayName,
    subject,
    gradeClass,
    chapter,
    topic: lesson.topic || chapter || "Weekly Lesson Plan",
    weeklyPlan: lesson.weeklyPlan?.length ? lesson.weeklyPlan : createFlexibleWeeklyPlan(subject, gradeClass, chapter),
    vocabulary: lesson.vocabulary?.length ? lesson.vocabulary : [{ id: "vocabulary", value: "" }],
    materialsResources: lesson.materialsResources?.length ? lesson.materialsResources : [{ id: "materials", value: "" }],
    differentiation: Object.assign({
      strugglingLearners: "",
      eslSupport: "",
      giftedLearners: "",
      specialNeeds: "",
      inclusiveStrategies: ""
    }, lesson.differentiation || {}),
    assessment: Object.assign({
      diagnostic: "",
      formative: "",
      summative: "",
      observationChecklist: "",
      rubric: "",
      exitTicket: "",
      teacherComments: ""
    }, lesson.assessment || {}),
    reflection: Object.assign({
      whatWentWell: "",
      challenges: "",
      improvements: "",
      followUpActivities: "",
      teacherNotes: ""
    }, lesson.reflection || {})
  };
};

const LockedSchool = () => (
  <div className="space-y-1">
    <Label>School</Label>
    <div className="flex h-10 items-center gap-2 rounded-md border border-cyan-300/20 bg-[#030d14]/80 px-3 text-sm font-bold text-white">
      <img src={schoolImage} alt="KCS logo" className="h-6 w-6 rounded-sm object-contain bg-white" />
      <span className="truncate">{schoolDisplayName}</span>
    </div>
  </div>
);

const Field = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
  </div>
);

const PrintPreview = ({ lesson, zoom }: { lesson: LessonPlan; zoom: number }) => {
  const height = `${(210 * 3 + 12) * zoom}mm`;
  const style = { "--preview-zoom": zoom } as CSSProperties;

  return (
    <div className="max-h-[72vh] overflow-auto rounded-lg border border-cyan-300/15 bg-slate-950/70 p-3">
      <div style={{ height }} className="mx-auto w-fit">
        <div className="origin-top-left [zoom:var(--preview-zoom)]" style={style}>
          <LessonPrint lesson={lesson} />
        </div>
      </div>
    </div>
  );
};
