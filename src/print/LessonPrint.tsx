import { forwardRef } from "react";
import { createFlexibleWeeklyPlan, schoolDisplayName, schoolImage } from "../data/defaults";
import { LessonPlan, WeeklyPlanDay } from "../types/lesson";

type RowKey = Exclude<keyof WeeklyPlanDay, "day">;

const planRows: [RowKey, string][] = [
  ["lesson", "Lesson"],
  ["objectives", "Objectives"],
  ["presentation", "Presentation"],
  ["guidedPractice", "Guided Practice"],
  ["exitTicket", "Exit Ticket"],
  ["assessment", "Assessment"],
  ["homework", "Homework"]
];

export const LessonPrint = forwardRef<HTMLDivElement, { lesson: LessonPlan }>(({ lesson }, ref) => {
  const weeklyPlan = normalizeWeeklyPlan(lesson);
  const planLabel = lesson.planType === "daily" ? "Daily Lesson Plan" : "Weekly Lesson Plan";
  const notes = buildNotes(lesson);
  const showNotesPage = notes.some((note) => note.value.trim().length > 160) || notes.length > 5;
  const totalPages = showNotesPage ? 2 : 1;
  const generatedAt = formatGeneratedAt(new Date());

  return (
    <div ref={ref} className="lesson-print-document bg-transparent text-black">
      <PrintPage lesson={lesson} pageTitle={planLabel} pageNumber={1} totalPages={totalPages} generatedAt={generatedAt}>
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_55mm] gap-2">
          <LessonTable rows={planRows} weeklyPlan={weeklyPlan} isDaily={lesson.planType === "daily"} />
          <CompactNotes notes={notes.slice(0, showNotesPage ? 4 : 7)} />
        </div>
        {!showNotesPage && <Signatures />}
      </PrintPage>
      {showNotesPage && (
        <PrintPage lesson={lesson} pageTitle={`${planLabel} - Support Notes`} pageNumber={2} totalPages={totalPages} generatedAt={generatedAt} compactHeader>
          <div className="grid grid-cols-2 gap-2 text-[8.2px] leading-tight">
            {notes.map((note) => <Box key={note.title} title={note.title} value={note.value} />)}
          </div>
          <Signatures />
        </PrintPage>
      )}
    </div>
  );
});

LessonPrint.displayName = "LessonPrint";

const PrintPage = ({
  lesson,
  pageTitle,
  pageNumber,
  totalPages,
  generatedAt,
  compactHeader = false,
  children
}: {
  lesson: LessonPlan;
  pageTitle: string;
  pageNumber: number;
  totalPages: number;
  generatedAt: string;
  compactHeader?: boolean;
  children: React.ReactNode;
}) => (
  <section className="print-page mx-auto flex flex-col bg-white p-[5mm] font-serif text-black shadow-fluent">
    <img src={schoolImage} alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.035]" />
    <header className="print-header relative rounded-sm border border-slate-300">
      <div className="grid grid-cols-[46px_1fr_76px] items-center gap-2 border-b border-slate-300 bg-slate-900 px-2.5 py-1.5 text-white">
        <span className="grid h-[42px] w-[42px] place-items-center rounded-sm bg-white p-1">
          <img src={schoolImage} alt="KCS logo" className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0 text-center">
          <p className="break-words text-[8.2px] font-bold uppercase leading-tight tracking-wide text-cyan-100">{safeText(lesson.schoolName, schoolDisplayName)}</p>
          <h1 className="break-words text-[12px] font-bold uppercase leading-tight tracking-wide text-white">{safeText(lesson.topic, lesson.planType === "daily" ? "Daily Lesson Plan" : "Weekly Lesson Plan")}</h1>
          <p className="break-words text-[8px] font-semibold uppercase leading-tight tracking-wide text-slate-200">{pageTitle}</p>
        </div>
        <div className="text-right text-[7.8px] font-semibold leading-tight text-slate-100">
          <p>Page {pageNumber}/{totalPages}</p>
          <p>{lesson.planType === "daily" ? safeText(lesson.date, "Daily") : formatWeek(lesson.week)}</p>
          <p>{safeText(lesson.schoolYear, "2026-2027")}</p>
          <p className="mt-0.5 text-[7px] text-slate-300">Printed: {generatedAt}</p>
        </div>
      </div>
      {!compactHeader && <HeaderDetails lesson={lesson} />}
    </header>

    <main className="relative mt-2 flex min-h-0 flex-1 flex-col">{children}</main>
    <footer className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-[7.2px] font-semibold uppercase tracking-wide text-slate-500">
      <span>KCS Lesson Planner</span>
      <span>Generated {generatedAt}</span>
      <span>{safeText(lesson.teachers, "Teacher")} · {safeText(lesson.subject, "Subject")}</span>
    </footer>
  </section>
);

const LessonTable = ({ rows, weeklyPlan, isDaily }: { rows: [RowKey, string][]; weeklyPlan: WeeklyPlanDay[]; isDaily: boolean }) => (
  <table className="h-full w-full table-fixed border-collapse border border-slate-400 text-[7.9px] leading-[1.12]">
    <thead>
      <tr className="h-[6mm]">
        <th className="w-[12%] border border-slate-400 bg-slate-100 px-1 text-center font-black uppercase text-slate-700">Section</th>
        {weeklyPlan.map((day) => (
          <th key={day.day} className="border border-slate-400 bg-cyan-50 px-1 text-center font-black uppercase text-slate-800">
            {isDaily ? "Daily Lesson" : day.day}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(([key, label]) => (
        <tr key={key} className="align-top">
          <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-center font-black uppercase text-slate-700">{label}</th>
          {weeklyPlan.map((day) => (
            <td key={`${day.day}-${key}`} className="border border-slate-400 p-1 align-top">
              <div className="whitespace-pre-line break-words">{safeText(day[key])}</div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const HeaderDetails = ({ lesson }: { lesson: LessonPlan }) => (
  <div className="grid grid-cols-4 border-t border-slate-300 text-[7.8px] leading-tight text-slate-900">
    <Detail label="Teacher" value={lesson.teachers} />
    <Detail label="Subject" value={lesson.subject} />
    <Detail label="Grade" value={lesson.gradeClass} />
    <Detail label="Date" value={lesson.date} />
    <Detail label="Chapter" value={lesson.chapter} wide />
    <Detail label={lesson.planType === "daily" ? "Plan" : "Week"} value={lesson.planType === "daily" ? "Daily" : formatWeek(lesson.week)} />
    <Detail label="Duration" value={lesson.duration} />
    <Detail label="Classroom" value={lesson.classroom} />
  </div>
);

const Detail = ({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) => (
  <div className={`grid grid-cols-[18mm_minmax(0,1fr)] border-r border-t border-slate-200 last:border-r-0 ${wide ? "col-span-2" : ""}`}>
    <span className="bg-slate-50 px-1 py-0.5 font-black uppercase text-slate-500">{label}</span>
    <span className="break-words bg-white px-1 py-0.5 font-bold text-slate-950">{safeText(value, "-")}</span>
  </div>
);

const CompactNotes = ({ notes }: { notes: { title: string; value: string }[] }) => (
  <aside className="grid content-start gap-1.5 text-[7.6px] leading-tight">
    {notes.map((note) => <Box key={note.title} title={note.title} value={note.value} compact />)}
  </aside>
);

const Box = ({ title, value, compact = false }: { title: string; value?: string; compact?: boolean }) => (
  <div className={`${compact ? "min-h-[16mm]" : "min-h-[22mm]"} rounded-sm border border-slate-300 bg-white p-1`}>
    <p className="border-b border-slate-200 pb-0.5 font-black uppercase text-slate-900">{title}</p>
    <p className="mt-0.5 whitespace-pre-line break-words text-slate-800">{safeText(value)}</p>
  </div>
);

const Signatures = () => (
  <div className="signature-block relative mt-3 grid grid-cols-2 gap-8 text-[8px] font-bold uppercase tracking-wide text-slate-700">
    <div className="pt-7">
      <div className="border-t border-slate-500 pt-1">Teacher Signature / Date</div>
    </div>
    <div className="pt-7">
      <div className="border-t border-slate-500 pt-1">Principal Signature / Date</div>
    </div>
  </div>
);

const buildNotes = (lesson: LessonPlan) => [
  { title: "Learning Objectives", value: lesson.learningObjectives?.map((item) => item.value).filter(Boolean).join("; ") || "" },
  { title: "Learning Outcomes", value: lesson.learningOutcomes?.map((item) => item.value).filter(Boolean).join("; ") || "" },
  { title: "Success Criteria", value: lesson.successCriteria?.map((item) => item.value).filter(Boolean).join("; ") || "" },
  { title: "Key Vocabulary", value: lesson.vocabulary?.map((item) => item.value).filter(Boolean).join("; ") || "" },
  { title: "Materials / Resources", value: lesson.materialsResources?.map((item) => item.value).filter(Boolean).join("; ") || "" },
  { title: "References", value: lesson.referenceBook || "" },
  { title: "Differentiation", value: Object.values(lesson.differentiation || {}).filter(Boolean).join("; ") },
  { title: "Assessment Notes", value: Object.values(lesson.assessment || {}).filter(Boolean).join("; ") },
  { title: "Reflection", value: Object.values(lesson.reflection || {}).filter(Boolean).join("; ") }
].filter((note) => note.value.trim());

const normalizeWeeklyPlan = (lesson: LessonPlan) => {
  const weeklyPlan = lesson.weeklyPlan;
  const base = createFlexibleWeeklyPlan(lesson.subject, lesson.gradeClass, lesson.chapter);

  const normalized = base.map((day, index) => ({
    ...day,
    ...(weeklyPlan?.[index] || {}),
    day: weeklyPlan?.[index]?.day || day.day,
    lesson: weeklyPlan?.[index]?.lesson ?? day.lesson,
    objectives: weeklyPlan?.[index]?.objectives ?? day.objectives,
    presentation: weeklyPlan?.[index]?.presentation ?? day.presentation,
    guidedPractice: weeklyPlan?.[index]?.guidedPractice ?? day.guidedPractice,
    exitTicket: weeklyPlan?.[index]?.exitTicket ?? day.exitTicket,
    assessment: weeklyPlan?.[index]?.assessment ?? day.assessment,
    homework: weeklyPlan?.[index]?.homework ?? day.homework
  }));

  return lesson.planType === "daily"
    ? [{ ...normalized[0], day: "Monday" as const, lesson: normalized[0].lesson || lesson.chapter || lesson.topic || "Daily Lesson" }]
    : normalized;
};

const safeText = (value?: unknown, fallback = " ") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const formatWeek = (week?: string) => {
  const value = safeText(week, "");
  return value.toLowerCase().startsWith("week") ? value : `Week ${safeText(week, "1")}`;
};

const formatGeneratedAt = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
