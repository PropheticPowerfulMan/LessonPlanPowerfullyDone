import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ChevronDown, Copy, Download, FileDown, GripVertical, History, Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useToast } from "../components/Toast";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog } from "../components/ui/dialog";
import { Input, Select, Textarea } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createBlankLesson, emptyItem } from "../data/defaults";
import { templates } from "../data/templates";
import { useDebouncedEffect } from "../hooks/useDebouncedEffect";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { LessonPrint } from "../print/LessonPrint";
import { lessonRepository } from "../services/lessonRepository";
import { LessonPlan } from "../types/lesson";
import { exportElementToDocx, exportElementToPdf } from "../utils/export";

const schema = z.object({
  schoolName: z.string().min(2),
  teachers: z.string().min(1, "Teacher is required"),
  subject: z.string().min(1, "Subject is required"),
  gradeClass: z.string().min(1, "Grade/Class is required"),
  topic: z.string().min(1, "Topic is required")
}).passthrough();

export const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [preview, setPreview] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<LessonPlan[]>([]);
  const [redoStack, setRedoStack] = useState<LessonPlan[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const lesson = useMemo(() => (id ? lessonRepository.get(id) : undefined), [id]);
  const fallback = useMemo(() => createBlankLesson(`LP-${new Date().getFullYear()}-0001`), []);

  const form = useForm<LessonPlan>({
    defaultValues: lesson || fallback,
    resolver: zodResolver(schema),
    mode: "onChange"
  });
  const values = form.watch();
  const objectiveArray = useFieldArray({ control: form.control, name: "learningObjectives" });
  const outcomeArray = useFieldArray({ control: form.control, name: "learningOutcomes" });
  const criteriaArray = useFieldArray({ control: form.control, name: "successCriteria" });
  const materialArray = useFieldArray({ control: form.control, name: "materialsResources" });
  const vocabularyArray = useFieldArray({ control: form.control, name: "vocabulary" });
  const safetyArray = useFieldArray({ control: form.control, name: "safetyConsiderations" });
  const stageArray = useFieldArray({ control: form.control, name: "stages" });

  const completion = useMemo(() => {
    const required = [values.teachers, values.subject, values.gradeClass, values.topic, values.date, values.duration, values.learningObjectives?.[0]?.value, values.stages?.[0]?.teacherActivities];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [values]);

  const save = (withVersion = false) => {
    const current = form.getValues();
    const now = new Date().toISOString();
    const next: LessonPlan = {
      ...current,
      updatedAt: now,
      versions: withVersion
        ? [{ id: crypto.randomUUID(), savedAt: now, summary: `Manual save: ${current.topic || "Untitled"}`, snapshot: { ...current, versions: [] } }, ...(current.versions || [])].slice(0, 20)
        : current.versions || []
    };
    lessonRepository.save(next);
    form.reset(next);
    notify(withVersion ? "Saved with version history" : "Auto-saved");
  };

  useDebouncedEffect(() => {
    if (form.formState.isDirty) save(false);
  }, [values], 900);

  useKeyboardShortcuts({
    save: () => save(true),
    undo: () => {
      const previous = undoStack[undoStack.length - 1];
      if (!previous) return;
      setRedoStack((stack) => [form.getValues(), ...stack]);
      setUndoStack((stack) => stack.slice(0, -1));
      form.reset(previous);
    },
    redo: () => {
      const next = redoStack[0];
      if (!next) return;
      setUndoStack((stack) => [...stack, form.getValues()]);
      setRedoStack((stack) => stack.slice(1));
      form.reset(next);
    },
    print: () => setPreview(true)
  });

  useEffect(() => {
    const sub = form.watch((_value, info) => {
      if (info.name) setUndoStack((stack) => [...stack.slice(-24), form.getValues()]);
    });
    return () => sub.unsubscribe();
  }, [form]);

  const print = useReactToPrint({ contentRef: printRef, documentTitle: values.topic || "Lesson Plan" });

  const applyTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    form.reset({ ...form.getValues(), ...template.prefill, updatedAt: new Date().toISOString() });
    notify(`${template.name} template applied`);
  };

  const duplicate = () => {
    const now = new Date().toISOString();
    const copy = { ...form.getValues(), id: crypto.randomUUID(), topic: `${values.topic} (Copy)`, lessonNumber: `LP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`, createdAt: now, updatedAt: now, versions: [] };
    lessonRepository.save(copy);
    notify("Duplicated lesson plan");
    navigate(`/editor/${copy.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{values.topic || "Untitled Lesson Plan"}</h1>
          <p className="text-sm text-muted-foreground">{values.lessonNumber} · Autosaving enabled · {completion}% complete</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save(true)}><Save size={17} /> Save</Button>
          <Button variant="outline" onClick={duplicate}><Copy size={17} /> Duplicate</Button>
          <Button variant="outline" onClick={() => setHistoryOpen(true)}><History size={17} /> Versions</Button>
          <Button variant="outline" onClick={() => setPreview(true)}><Printer size={17} /> Preview</Button>
          <Button variant="outline" onClick={() => printRef.current && exportElementToPdf(printRef.current, `${values.topic || "lesson-plan"}.pdf`)}><FileDown size={17} /> PDF</Button>
          <Button variant="outline" onClick={() => printRef.current && exportElementToDocx(printRef.current, `${values.topic || "lesson-plan"}.docx`)}><Download size={17} /> DOCX</Button>
          <Button variant="danger" onClick={() => { if (confirm("Delete this lesson plan permanently?")) { lessonRepository.remove(values.id); navigate("/plans"); } }}><Trash2 size={17} /></Button>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} /></div>

      <form className="grid gap-5 xl:grid-cols-[1fr_360px]" onSubmit={form.handleSubmit(() => save(true))}>
        <div className="space-y-5">
          <Section title="Core Details">
            <div className="grid gap-3 md:grid-cols-3">
              {(["schoolName", "teachers", "subject", "gradeClass", "date", "week", "term", "duration", "classroom", "numberOfStudents", "topic", "subtopic", "referenceBook", "learningArea"] as const).map((name) => (
                <Field key={name} label={labelize(name)} error={form.formState.errors[name]?.message as string}>
                  <Input type={name === "date" ? "date" : "text"} list={`${name}-suggestions`} {...form.register(name)} />
                  <datalist id={`${name}-suggestions`}>
                    {suggestions[name]?.map((item) => <option key={item} value={item} />)}
                  </datalist>
                </Field>
              ))}
              <Field label="Tags">
                <Input value={values.tags?.join(", ") || ""} onChange={(e) => form.setValue("tags", e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean), { shouldDirty: true })} />
              </Field>
            </div>
            <Field label="Biblical Integration (optional)"><Textarea {...form.register("biblicalIntegration")} /></Field>
            <Field label="Cross-Curricular Connections"><Textarea {...form.register("crossCurricularConnections")} /></Field>
          </Section>

          <Section title="Repeatable Planning Sections">
            <Repeatable title="Learning Objectives" array={objectiveArray} name="learningObjectives" control={form.control} />
            <Repeatable title="Learning Outcomes" array={outcomeArray} name="learningOutcomes" control={form.control} />
            <Repeatable title="Success Criteria" array={criteriaArray} name="successCriteria" control={form.control} />
            <Repeatable title="Materials & Resources" array={materialArray} name="materialsResources" control={form.control} />
            <Repeatable title="Vocabulary" array={vocabularyArray} name="vocabulary" control={form.control} />
            <Repeatable title="Safety Considerations" array={safetyArray} name="safetyConsiderations" control={form.control} />
          </Section>

          <Section title="Lesson Stages">
            <div className="space-y-3">
              {stageArray.fields.map((stage, index) => (
                <details key={stage.id} className="rounded-xl border bg-background p-3" open={index < 2}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">
                    <span className="flex items-center gap-2"><GripVertical size={17} /> {stage.name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">{values.stages?.[index]?.duration}<ChevronDown size={16} /></span>
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Duration"><Input {...form.register(`stages.${index}.duration`)} /></Field>
                    <div className="flex items-end gap-2">
                      <Button type="button" variant="outline" onClick={() => index > 0 && stageArray.move(index, index - 1)}>Move Up</Button>
                      <Button type="button" variant="outline" onClick={() => index < stageArray.fields.length - 1 && stageArray.move(index, index + 1)}>Move Down</Button>
                    </div>
                    <Field label="Teacher Activities"><Textarea {...form.register(`stages.${index}.teacherActivities`)} /></Field>
                    <Field label="Student Activities"><Textarea {...form.register(`stages.${index}.studentActivities`)} /></Field>
                    <Field label="Resources"><Textarea {...form.register(`stages.${index}.resources`)} /></Field>
                    <Field label="Notes"><Textarea {...form.register(`stages.${index}.notes`)} /></Field>
                    <Field label="Attachments"><Input value={values.stages?.[index]?.attachments?.join(", ") || ""} onChange={(e) => form.setValue(`stages.${index}.attachments`, e.target.value.split(",").map((x) => x.trim()).filter(Boolean), { shouldDirty: true })} /></Field>
                    <Field label="Optional Images"><Input value={values.stages?.[index]?.images?.join(", ") || ""} onChange={(e) => form.setValue(`stages.${index}.images`, e.target.value.split(",").map((x) => x.trim()).filter(Boolean), { shouldDirty: true })} /></Field>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section title="Bloom's Taxonomy Questions">
            <div className="grid gap-3 md:grid-cols-3">
              {Object.keys(values.blooms || {}).map((key) => (
                <Field key={key} label={labelize(key)}>
                  <Textarea value={(values.blooms as any)[key]?.join("\n") || ""} onChange={(e) => form.setValue(`blooms.${key as keyof LessonPlan["blooms"]}`, e.target.value.split("\n"), { shouldDirty: true })} />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Differentiation, Assessment & Reflection">
            <GroupedTextarea title="Differentiation" keys={Object.keys(values.differentiation || {})} path="differentiation" form={form} />
            <GroupedTextarea title="Assessment" keys={Object.keys(values.assessment || {})} path="assessment" form={form} />
            <GroupedTextarea title="Reflection" keys={Object.keys(values.reflection || {})} path="reflection" form={form} />
          </Section>
        </div>

        <aside className="space-y-5">
          <Card className="sticky top-24 p-4">
            <h2 className="mb-3 text-lg font-black">Templates</h2>
            <Select onChange={(e) => applyTemplate(e.target.value)} defaultValue="">
              <option value="" disabled>Select a professional template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </Select>
            <div className="mt-4 grid gap-2 text-sm">
              <Button type="button" variant="outline" onClick={() => form.setValue("status", values.status === "archived" ? "active" : "archived", { shouldDirty: true })}>
                <Archive size={16} /> {values.status === "archived" ? "Restore Plan" : "Archive Plan"}
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset(lessonRepository.get(values.id) || fallback)}>
                <RotateCcw size={16} /> Revert Unsaved
              </Button>
            </div>
          </Card>
          <div className="hidden xl:block"><LessonPrint lesson={values} ref={printRef} /></div>
        </aside>
      </form>

      <Dialog open={preview} title="Exact Print Preview" onClose={() => setPreview(false)}>
        <div className="mb-4 flex justify-end"><Button onClick={print}><Printer size={17} /> Print</Button></div>
        <LessonPrint lesson={values} ref={printRef} />
      </Dialog>
      <Dialog open={historyOpen} title="Version History" onClose={() => setHistoryOpen(false)}>
        <div className="space-y-2">
          {(values.versions || []).map((version) => (
            <Card key={version.id} className="flex items-center justify-between gap-3 p-3">
              <div><p className="font-bold">{version.summary}</p><p className="text-sm text-muted-foreground">{new Date(version.savedAt).toLocaleString()}</p></div>
              <Button variant="outline" onClick={() => form.reset(version.snapshot)}>Restore</Button>
            </Card>
          ))}
          {!values.versions?.length && <p className="text-sm text-muted-foreground">No manual save versions yet.</p>}
        </div>
      </Dialog>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="p-5">
    <h2 className="mb-4 text-xl font-black">{title}</h2>
    <div className="space-y-4">{children}</div>
  </Card>
);

const Field = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
  </div>
);

const Repeatable = ({ title, array, name, control }: any) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label>{title}</Label>
      <Button type="button" variant="ghost" onClick={() => array.append(emptyItem())}><Plus size={16} /> Add</Button>
    </div>
    {array.fields.map((field: any, index: number) => (
      <div key={field.id} className="flex gap-2">
        <Controller control={control} name={`${name}.${index}.value`} render={({ field }) => <Input {...field} />} />
        <Button type="button" variant="ghost" onClick={() => array.remove(index)}><Trash2 size={16} /></Button>
      </div>
    ))}
  </div>
);

const GroupedTextarea = ({ title, keys, path, form }: { title: string; keys: string[]; path: string; form: any }) => (
  <div>
    <h3 className="mb-2 font-bold">{title}</h3>
    <div className="grid gap-3 md:grid-cols-2">
      {keys.map((key) => <Field key={key} label={labelize(key)}><Textarea {...form.register(`${path}.${key}`)} /></Field>)}
    </div>
  </div>
);

const labelize = (value: string) => value.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase());

const suggestions: Record<string, string[]> = {
  subject: ["Mathematics", "Computer Science", "Science", "Physics", "Chemistry", "Biology", "English", "French", "Geography", "History", "Music", "Art", "PE"],
  gradeClass: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
  term: ["Term 1", "Term 2", "Term 3"],
  duration: ["30 min", "45 min", "60 min", "90 min"],
  learningArea: ["Inquiry", "Problem Solving", "Language Acquisition", "Scientific Investigation", "Creative Expression"]
};
