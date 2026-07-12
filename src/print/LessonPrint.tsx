import { forwardRef } from "react";
import { createFlexibleWeeklyPlan, schoolDisplayName, schoolImage } from "../data/defaults";
import { getActivityDurations } from "../services/durationValidationService";
import { getPrintDensity, isLikelyOversizedForOnePage } from "../services/printDensityService";
import { LessonPlan, WeeklyPlanDay } from "../types/lesson";

type RowKey = keyof Pick<WeeklyPlanDay, "lesson" | "objectives" | "presentation" | "guidedPractice" | "exitTicket" | "assessment" | "homework">;

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
  const generatedAt = formatGeneratedAt(new Date());
  const density = getPrintDensity({ ...lesson, weeklyPlan });
  const oversized = isLikelyOversizedForOnePage({ ...lesson, weeklyPlan });

  return (
    <div ref={ref} className="lesson-print-document bg-transparent text-black">
      <PrintPage lesson={lesson} pageTitle={planLabel} generatedAt={generatedAt} density={density} oversized={oversized}>
        <LessonTable rows={planRows} weeklyPlan={weeklyPlan} isDaily={lesson.planType === "daily"} />
        <Signatures lesson={lesson} />
      </PrintPage>
    </div>
  );
});

LessonPrint.displayName = "LessonPrint";

const PrintPage = ({
  lesson,
  pageTitle,
  generatedAt,
  density,
  oversized,
  children
}: {
  lesson: LessonPlan;
  pageTitle: string;
  generatedAt: string;
  density: string;
  oversized: boolean;
  children: React.ReactNode;
}) => (
  <section className={`print-page print-density-${density} mx-auto flex flex-col bg-white p-[5mm] font-serif text-black shadow-fluent`}>
    <Watermark status={lesson.status} planType={lesson.planType} />
    <header className="print-header relative rounded-sm border border-slate-300">
      <div className="grid grid-cols-[48px_1fr_86px] items-center gap-2 border-b-2 border-slate-800 bg-slate-50 px-2 py-1 text-slate-950">
        <span className="grid h-[44px] w-[44px] place-items-center rounded-sm border border-slate-300 bg-white p-1">
          <img src={schoolImage} alt="KCS logo" className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0 text-center">
          <p className="break-words text-[8.2px] font-black uppercase leading-tight tracking-wide text-slate-800">{safeText(lesson.schoolName, schoolDisplayName)}</p>
          <h1 className="break-words text-[12.4px] font-black uppercase leading-tight tracking-wide text-slate-950">{safeText(lesson.topic, lesson.planType === "daily" ? "Daily Lesson Plan" : "Weekly Lesson Plan")}</h1>
          <p className="break-words text-[7.8px] font-black uppercase leading-tight tracking-wide text-slate-700">{pageTitle}</p>
        </div>
        <div className="rounded-sm border border-slate-300 bg-white p-1 text-right text-[6.8px] font-black leading-tight text-slate-900">
          <p>Page 1/1</p>
          <p>{lesson.planType === "daily" ? safeText(lesson.date, "Daily") : formatWeek(lesson.week)}</p>
          {lesson.planType === "weekly" && <p className="text-[6.7px]">{formatWeekRange(lesson)}</p>}
          <p>{safeText(lesson.schoolYear, "2026-2027")}</p>
        </div>
      </div>
      <HeaderDetails lesson={lesson} />
    </header>
    {oversized && (
      <p className="relative mt-1 border border-amber-400 bg-amber-50 px-2 py-1 text-[7.5px] font-bold text-amber-900">
        One-page warning: this lesson contains dense content. Shorten oversized cells or use compact wording before final printing.
      </p>
    )}

    <main className="relative mt-1.5 flex min-h-0 flex-1 flex-col">{children}</main>
    <footer className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-[7.2px] font-semibold uppercase tracking-wide text-slate-500">
      <span>KCS Lesson Planner</span>
      <span>Generated on {generatedAt}</span>
      <span>{safeText(lesson.status, "draft")} | Modified {formatGeneratedAt(new Date(lesson.updatedAt || Date.now()))}</span>
    </footer>
  </section>
);

const LessonTable = ({ rows, weeklyPlan, isDaily }: { rows: [RowKey, string][]; weeklyPlan: WeeklyPlanDay[]; isDaily: boolean }) => (
  <div className="lesson-table-shell min-h-0 flex-1">
    <table className="lesson-table h-full min-h-0 w-full table-fixed border-collapse border border-slate-400 text-[7.9px] leading-[1.12]">
      <thead>
        <tr>
          <th className="w-[12%] border border-slate-400 bg-slate-100 px-1 py-1 text-center font-black uppercase leading-none text-slate-800">Section</th>
          {weeklyPlan.map((day) => (
            <th key={day.day} className="day-header border border-slate-400 bg-cyan-50 px-1 py-1 text-center font-black uppercase leading-none text-slate-950">
              {isDaily ? "Daily Lesson" : day.day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([key, label]) => (
          <tr key={key} className="align-top">
            <th className="row-label border border-slate-400 bg-slate-50 px-1 py-1 text-center font-black uppercase leading-tight text-slate-700">{label}</th>
            {weeklyPlan.map((day, index) => (
              <td key={`${day.day}-${key}`} className="border border-slate-400 p-1 align-top">
                <div className="whitespace-pre-line break-words">
                  <DurationBadge rowKey={key} day={day} index={index} />
                  {safeText(day[key])}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const HeaderDetails = ({ lesson }: { lesson: LessonPlan }) => (
  <table className="print-meta-table w-full table-fixed border-collapse text-[7.2px] leading-none text-slate-950">
    <tbody>
      <tr>
        <Detail label="Teacher" value={lesson.teachers} />
        <Detail label="Subject" value={lesson.subject} />
        <Detail label="Grade" value={lesson.gradeClass} />
        <Detail label="Duration" value={lesson.duration} />
      </tr>
      <tr>
        <Detail label="Unit" value={lesson.chapter} colSpan={2} />
        <Detail label={lesson.planType === "daily" ? "Plan" : "Week"} value={lesson.planType === "daily" ? "Daily" : formatWeek(lesson.week)} />
        <Detail label="ID / Status" value={`${safeText(lesson.lessonNumber, lesson.id)} / ${safeText(lesson.status, "draft")}`} />
      </tr>
    </tbody>
  </table>
);

const Detail = ({ label, value, colSpan = 1 }: { label: string; value?: string; colSpan?: number }) => (
  <td className="border border-slate-500 p-0 align-top" colSpan={colSpan}>
    <div className="grid min-h-[4.2mm] grid-cols-[15mm_minmax(0,1fr)]">
      <span className="border-r border-slate-500 bg-slate-200 px-1 py-0.5 font-black uppercase text-slate-950">{label}</span>
      <span className="break-words bg-white px-1 py-0.5 font-black text-slate-950">{safeText(value, "-")}</span>
    </div>
  </td>
);

const Signatures = ({ lesson }: { lesson: LessonPlan }) => (
  <div className="signature-block relative mt-1.5 grid grid-cols-[1fr_1fr_21mm] items-end gap-5 text-[7.4px] font-bold uppercase tracking-wide text-slate-700">
    <div className="pt-4">
      <div className="border-t border-slate-500 pt-1">Teacher Signature / Date</div>
    </div>
    <div className="pt-4">
      <div className="border-t border-slate-500 pt-1">Principal Signature / Date</div>
    </div>
    <QrCodeBox lesson={lesson} />
  </div>
);

const QrCodeBox = ({ lesson }: { lesson: LessonPlan }) => {
  const payload = buildQrPayload(lesson);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(payload)}`;

  return (
    <div className="justify-self-end text-center">
      <img src={qrUrl} alt="Lesson plan QR code" className="h-[18mm] w-[18mm] bg-white" crossOrigin="anonymous" />
      <p className="mt-0.5 text-[5.2px] leading-none text-slate-600">Scan to open the digital Lesson Plan</p>
    </div>
  );
};

const DurationBadge = ({ rowKey, day, index }: { rowKey: RowKey; day: WeeklyPlanDay; index: number }) => {
  if (!["presentation", "guidedPractice", "exitTicket"].includes(rowKey)) return null;
  const durations = getActivityDurations(day, index);
  const value = durations[rowKey as keyof typeof durations];
  return (
    <span className="duration-badge mb-0.5 mr-1 inline-block rounded-full border border-slate-300 bg-slate-100 font-black text-slate-700">
      <span className="duration-badge-text">{value} min</span>
    </span>
  );
};

const Watermark = ({ status, planType }: { status: LessonPlan["status"]; planType: LessonPlan["planType"] }) => {
  if (planType === "daily") {
    return <img src={schoolImage} alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.035]" />;
  }

  const label = status === "approved" || status === "final-approved" ? "Approved" : status === "submitted" ? "Submitted" : status === "under-review" ? "Under Review" : status === "draft" ? "Draft" : "";
  if (!label) {
    return <img src={schoolImage} alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.035]" />;
  }
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] text-[48px] font-black uppercase tracking-[0.28em] text-slate-900 opacity-[0.035]">
      {label}
    </div>
  );
};

const buildQrPayload = (lesson: LessonPlan) => {
  const schedule = lesson.planType === "daily" ? safeText(lesson.date, "Daily") : formatWeekRange(lesson);
  return [
    `KCS Lesson Plan`,
    `No: ${safeText(lesson.lessonNumber, lesson.id)}`,
    `Type: ${lesson.planType === "daily" ? "Daily" : "Weekly"}`,
    `Teacher: ${safeText(lesson.teachers, "Teacher")}`,
    `Subject: ${safeText(lesson.subject, "Subject")}`,
    `Class: ${safeText(lesson.gradeClass, "Class")}`,
    `Schedule: ${schedule}`
  ].join("\n");
};

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

const formatWeekRange = (lesson: LessonPlan) =>
  `${formatWeek(lesson.week)} from ${formatDateLabel(lesson.weekStartDate)} to ${formatDateLabel(lesson.weekEndDate)}`;

const formatDateLabel = (value?: string) => {
  if (!value) return "...";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "...";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
};

const formatGeneratedAt = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
