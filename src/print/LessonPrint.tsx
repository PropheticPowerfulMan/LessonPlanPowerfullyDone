import { forwardRef } from "react";
import { createFlexibleWeeklyPlan, schoolDisplayName, schoolImage } from "../data/defaults";
import { LessonPlan, WeeklyPlanDay } from "../types/lesson";

type RowKey = Exclude<keyof WeeklyPlanDay, "day">;

const pageGroups: { title: string; rows: [RowKey, string][] }[] = [
  {
    title: "Lessons and Objectives",
    rows: [
      ["lesson", "Lesson"],
      ["objectives", "Objectives"]
    ]
  },
  {
    title: "Teaching and Practice",
    rows: [
      ["presentation", "Presentation"],
      ["guidedPractice", "Guided Practice"]
    ]
  },
  {
    title: "Checking Understanding",
    rows: [
      ["exitTicket", "Exit Ticket"],
      ["assessment", "Assessment"],
      ["homework", "Homework"]
    ]
  }
];

export const LessonPrint = forwardRef<HTMLDivElement, { lesson: LessonPlan }>(({ lesson }, ref) => {
  const weeklyPlan = normalizeWeeklyPlan(lesson);
  const planLabel = lesson.planType === "daily" ? "Daily Lesson Plan" : "Weekly Lesson Plan";

  return (
    <div ref={ref} className="lesson-print-document bg-transparent text-black">
      {pageGroups.map((group, pageIndex) => (
        <PrintPage key={group.title} lesson={lesson} pageTitle={`${planLabel} - ${group.title}`} pageNumber={pageIndex + 1}>
          <LessonTable rows={group.rows} weeklyPlan={weeklyPlan} />
          {pageIndex === 2 && <PrintNotes lesson={lesson} />}
        </PrintPage>
      ))}
    </div>
  );
});

LessonPrint.displayName = "LessonPrint";

const PrintPage = ({ lesson, pageTitle, pageNumber, children }: { lesson: LessonPlan; pageTitle: string; pageNumber: number; children: React.ReactNode }) => (
  <section className="print-page mx-auto flex flex-col overflow-hidden bg-white p-[7mm] font-serif text-black shadow-fluent">
    <img src={schoolImage} alt="" className="pointer-events-none absolute right-[14mm] top-[78mm] h-[330px] w-[330px] object-contain opacity-[0.018]" />
    <header className="relative rounded-sm border border-slate-300">
      <div className="grid grid-cols-[56px_1fr_82px] items-center gap-3 border-b border-slate-300 bg-slate-50 px-3 py-2">
        <img src={schoolImage} alt="KCS logo" className="h-[48px] w-[48px] object-contain" />
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">{safeText(lesson.schoolName, schoolDisplayName)}</p>
          <h1 className="text-[15px] font-bold uppercase tracking-wide text-slate-950">{safeText(lesson.topic, lesson.planType === "daily" ? "Daily Lesson Plan" : "Weekly Lesson Plan")}</h1>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">{pageTitle}</p>
        </div>
        <div className="text-right text-[8.5px] leading-tight text-slate-700">
          <p className="font-bold text-slate-950">Page {pageNumber}/3</p>
          <p>{lesson.planType === "daily" ? "Daily" : formatWeek(lesson.week)}</p>
          <p>{safeText(lesson.schoolYear, "2026 - 2027")}</p>
        </div>
      </div>
      <HeaderDetails lesson={lesson} />
    </header>

    <main className="relative mt-2 min-h-0">{children}</main>
  </section>
);

const LessonTable = ({ rows, weeklyPlan }: { rows: [RowKey, string][]; weeklyPlan: WeeklyPlanDay[] }) => (
  <table className="w-full table-fixed border-collapse border border-slate-500 text-[8.5px] leading-[1.18]">
    <thead>
      <tr className="h-[7mm]">
        <th className="w-[10.5%] border border-slate-500 bg-slate-100 px-1 text-center font-bold">Day</th>
        {weeklyPlan.map((day) => (
          <th key={day.day} className="border border-slate-500 bg-slate-100 px-1 text-center font-bold">
            {day.day}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(([key, label]) => (
        <tr key={key} className="align-top">
          <th className="border border-slate-500 bg-slate-50 px-1 py-1 text-center font-bold">{label}</th>
          {weeklyPlan.map((day) => (
            <td key={`${day.day}-${key}`} className="border border-slate-500 p-1 align-top">
              <div className="min-h-[22mm] max-h-[36mm] overflow-hidden whitespace-pre-line break-words">{safeText(day[key])}</div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const PrintNotes = ({ lesson }: { lesson: LessonPlan }) => (
  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[8.2px] leading-tight">
    <Box title="Learning Objectives" value={lesson.learningObjectives?.map((item) => item.value).filter(Boolean).join("; ")} />
    <Box title="Key Vocabulary" value={lesson.vocabulary?.map((item) => item.value).filter(Boolean).join("; ")} />
    <Box title="Materials / Resources" value={lesson.materialsResources?.map((item) => item.value).filter(Boolean).join("; ")} />
    <Box title="References" value={lesson.referenceBook} />
    <Box title="Differentiation" value={Object.values(lesson.differentiation || {}).filter(Boolean).join("; ")} />
    <Box title="Assessment Notes" value={Object.values(lesson.assessment || {}).filter(Boolean).join("; ")} />
    <Box title="Reflection" value={Object.values(lesson.reflection || {}).filter(Boolean).join("; ")} />
  </div>
);

const HeaderDetails = ({ lesson }: { lesson: LessonPlan }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      borderTop: "1px solid #cbd5e1",
      fontSize: "9.6px",
      lineHeight: 1.25,
      color: "#0f172a"
    }}
  >
    <tbody>
      <tr>
        <Detail label="Teacher" value={lesson.teachers} />
        <Detail label="Subject" value={lesson.subject} />
      </tr>
      <tr>
        <Detail label="Grade" value={lesson.gradeClass} />
        <Detail label="Chapter / Unit" value={lesson.chapter} />
      </tr>
      <tr>
        <Detail label="Date" value={lesson.date} />
        <Detail label="School Year" value={lesson.schoolYear} />
      </tr>
      <tr>
        <Detail label={lesson.planType === "daily" ? "Plan Type" : "Week"} value={lesson.planType === "daily" ? "Daily Lesson Plan" : formatWeek(lesson.week)} />
        <Detail label="Duration" value={lesson.duration} />
      </tr>
      <tr>
        <Detail label="Semester" value={formatSemester(lesson.semester)} />
        <Detail label="Quarter" value={formatQuarter(lesson.quarter)} />
      </tr>
      <tr>
        <Detail label="Term" value={lesson.term} />
        <Detail label="Classroom" value={lesson.classroom} />
      </tr>
      <tr>
        <Detail label="Students" value={lesson.numberOfStudents} />
        <Detail label="Lesson No." value={lesson.lessonNumber} />
      </tr>
    </tbody>
  </table>
);

const Detail = ({ label, value }: { label: string; value?: string }) => (
  <>
    <td
      style={{
        width: "18%",
        border: "1px solid #cbd5e1",
        background: "#f8fafc",
        padding: "3px 5px",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        color: "#475569",
        verticalAlign: "top"
      }}
    >
      {label}
    </td>
    <td
      style={{
        width: "32%",
        border: "1px solid #cbd5e1",
        background: "#ffffff",
        padding: "3px 5px",
        fontWeight: 800,
        color: "#0f172a",
        verticalAlign: "top",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      }}
    >
      {safeText(value, "-")}
    </td>
  </>
);

const Box = ({ title, value }: { title: string; value?: string }) => (
  <div className="h-[15mm] overflow-hidden border border-slate-500 bg-white p-1">
    <p className="font-bold text-slate-900">{title}</p>
    <p className="mt-0.5 whitespace-pre-line break-words">{safeText(value)}</p>
  </div>
);

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

const formatSemester = (semester?: string) => {
  const value = safeText(semester, "");
  return value.toLowerCase().includes("semester") ? value : `${safeText(semester, "1st")} Semester`;
};

const formatQuarter = (quarter?: string) => {
  const value = safeText(quarter, "");
  return value.toLowerCase().includes("quarter") ? value : `${safeText(quarter, "1st")} Quarter`;
};
