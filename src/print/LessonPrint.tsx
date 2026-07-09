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
        {!showNotesPage && <Signatures lesson={lesson} />}
      </PrintPage>
      {showNotesPage && (
        <PrintPage lesson={lesson} pageTitle={`${planLabel} - Support Notes`} pageNumber={2} totalPages={totalPages} generatedAt={generatedAt} compactHeader>
          <div className="grid grid-cols-2 gap-2 text-[8.2px] leading-tight">
            {notes.map((note) => <Box key={note.title} title={note.title} value={note.value} />)}
          </div>
          <Signatures lesson={lesson} />
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
      <div className="grid grid-cols-[58px_1fr_90px] items-center gap-2 border-b-2 border-slate-800 bg-slate-50 px-2.5 py-1.5 text-slate-950">
        <span className="grid h-[54px] w-[54px] place-items-center rounded-sm border border-slate-300 bg-white p-1">
          <img src={schoolImage} alt="KCS logo" className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0 text-center">
          <p className="break-words text-[9px] font-black uppercase leading-tight tracking-wide text-slate-800">{safeText(lesson.schoolName, schoolDisplayName)}</p>
          <h1 className="break-words text-[13.5px] font-black uppercase leading-tight tracking-wide text-slate-950">{safeText(lesson.topic, lesson.planType === "daily" ? "Daily Lesson Plan" : "Weekly Lesson Plan")}</h1>
          <p className="break-words text-[8.5px] font-black uppercase leading-tight tracking-wide text-slate-700">{pageTitle}</p>
        </div>
        <div className="rounded-sm border border-slate-300 bg-white p-1 text-right text-[7.6px] font-black leading-tight text-slate-900">
          <p>Page {pageNumber}/{totalPages}</p>
          <p>{lesson.planType === "daily" ? safeText(lesson.date, "Daily") : formatWeek(lesson.week)}</p>
          {lesson.planType === "weekly" && <p className="text-[6.7px]">{formatWeekRange(lesson)}</p>}
          <p>{safeText(lesson.schoolYear, "2026-2027")}</p>
          <p className="mt-0.5 text-[6.8px] text-slate-700">Printed: {generatedAt}</p>
        </div>
      </div>
      {!compactHeader && <HeaderDetails lesson={lesson} />}
    </header>

    <main className="relative mt-2 flex min-h-0 flex-1 flex-col">{children}</main>
    <footer className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-[7.2px] font-semibold uppercase tracking-wide text-slate-500">
      <span>KCS Lesson Planner</span>
      <span>Generated {generatedAt}</span>
      <span>{safeText(lesson.teachers, "Teacher")} | {safeText(lesson.subject, "Subject")}</span>
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
  <table className="w-full table-fixed border-collapse text-[9.2px] leading-[1.18] text-slate-950">
    <tbody>
      <tr>
        <Detail label="Teacher" value={lesson.teachers} />
        <Detail label="Subject" value={lesson.subject} />
        <Detail label="Grade" value={lesson.gradeClass} />
        <Detail label="Date" value={lesson.date} />
      </tr>
      <tr>
        <Detail label="Chapter / Unit" value={lesson.chapter} colSpan={3} />
        <Detail label={lesson.planType === "daily" ? "Plan" : "Week"} value={lesson.planType === "daily" ? "Daily" : formatWeek(lesson.week)} />
      </tr>
      <tr>
        {lesson.planType === "weekly" && <Detail label="Week Range" value={formatWeekRange(lesson)} colSpan={2} />}
        <Detail label="Duration" value={lesson.duration} />
        <Detail label="Classroom" value={lesson.classroom} />
      </tr>
      <tr>
        <Detail label="School Year" value={lesson.schoolYear} />
        <Detail label="Lesson No." value={lesson.lessonNumber} />
      </tr>
    </tbody>
  </table>
);

const Detail = ({ label, value, colSpan = 1 }: { label: string; value?: string; colSpan?: number }) => (
  <td className="border border-slate-500 p-0 align-top" colSpan={colSpan}>
    <div className="grid min-h-[7mm] grid-cols-[22mm_minmax(0,1fr)]">
      <span className="border-r border-slate-500 bg-slate-200 px-1.5 py-1 font-black uppercase text-slate-950">{label}</span>
      <span className="break-words bg-white px-1.5 py-1 font-black text-slate-950">{safeText(value, "-")}</span>
    </div>
  </td>
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

const Signatures = ({ lesson }: { lesson: LessonPlan }) => (
  <div className="signature-block relative mt-3 grid grid-cols-[1fr_1fr_25mm] items-end gap-6 text-[8px] font-bold uppercase tracking-wide text-slate-700">
    <div className="pt-7">
      <div className="border-t border-slate-500 pt-1">Teacher Signature / Date</div>
    </div>
    <div className="pt-7">
      <div className="border-t border-slate-500 pt-1">Principal Signature / Date</div>
    </div>
    <QrCodeBox lesson={lesson} />
  </div>
);

const QrCodeBox = ({ lesson }: { lesson: LessonPlan }) => {
  const payload = `KCS:${safeText(lesson.lessonNumber, lesson.id).slice(0, 13)}`;
  const modules = createQrModules(payload);
  const size = modules.length;
  const quietZone = 4;
  const viewBoxSize = size + quietZone * 2;

  return (
    <div className="justify-self-end text-center">
      <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="h-[21mm] w-[21mm] bg-white" role="img" aria-label="Lesson plan QR code">
        <rect width={viewBoxSize} height={viewBoxSize} fill="#fff" />
        {modules.map((row, y) => row.map((dark, x) => dark ? <rect key={`${x}-${y}`} x={x + quietZone} y={y + quietZone} width="1" height="1" fill="#111827" /> : null))}
      </svg>
      <p className="mt-0.5 text-[5.8px] leading-tight text-slate-600">QR: {payload}</p>
    </div>
  );
};

const createQrModules = (text: string) => {
  const size = 21;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array<boolean | null>(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const set = (x: number, y: number, dark: boolean, functional = false) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    matrix[y][x] = dark;
    if (functional) isFunction[y][x] = true;
  };

  const drawFinder = (x: number, y: number) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        const inFinder = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
        const dark = inFinder && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        set(xx, yy, dark, true);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  for (let i = 8; i < size - 8; i += 1) {
    set(i, 6, i % 2 === 0, true);
    set(6, i, i % 2 === 0, true);
  }
  set(8, size - 8, true, true);

  const codewords = encodeQrCodewords(text);
  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vert = 0; vert < size; vert += 1) {
      const y = upward ? size - 1 - vert : vert;
      for (let col = 0; col < 2; col += 1) {
        const x = right - col;
        if (isFunction[y][x]) continue;
        const dark = bitIndex < codewords.length * 8 ? ((codewords[Math.floor(bitIndex / 8)] >>> (7 - (bitIndex % 8))) & 1) === 1 : false;
        matrix[y][x] = ((x + y) % 2 === 0) ? !dark : dark;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }

  drawFormatBits(matrix, isFunction, 0);
  return matrix.map((row) => row.map(Boolean));
};

const encodeQrCodewords = (text: string) => {
  const bytes = Array.from(text).map((char) => char.charCodeAt(0) & 0xff).slice(0, 17);
  const bits: number[] = [];
  const append = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  append(0b0100, 4);
  append(bytes.length, 8);
  bytes.forEach((byte) => append(byte, 8));
  for (let i = 0; i < 4 && bits.length < 152; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
  for (let pad = 0; data.length < 19; pad += 1) data.push(pad % 2 === 0 ? 0xec : 0x11);
  return [...data, ...reedSolomonRemainder(data, 7)];
};

const reedSolomonRemainder = (data: number[], degree: number) => {
  const exp = Array<number>(512).fill(0);
  const log = Array<number>(256).fill(0);
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    exp[i] = value;
    log[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) exp[i] = exp[i - 255];
  const multiply = (a: number, b: number) => (a && b ? exp[log[a] + log[b]] : 0);
  let generator = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = Array(generator.length + 1).fill(0);
    generator.forEach((coef, index) => {
      next[index] ^= multiply(coef, exp[i]);
      next[index + 1] ^= coef;
    });
    generator = next;
  }
  const result = Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result.shift()!;
    result.push(0);
    generator.slice(1).forEach((coef, index) => {
      result[index] ^= multiply(coef, factor);
    });
  });
  return result;
};

const drawFormatBits = (matrix: (boolean | null)[][], isFunction: boolean[][], mask: number) => {
  const size = matrix.length;
  const data = (1 << 3) | mask;
  let bits = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((bits >>> i) & 1) bits ^= 0x537 << (i - 10);
  }
  const format = ((data << 10) | bits) ^ 0x5412;
  const set = (x: number, y: number, bit: number) => {
    matrix[y][x] = ((format >>> bit) & 1) === 1;
    isFunction[y][x] = true;
  };
  for (let i = 0; i <= 5; i += 1) set(8, i, i);
  set(8, 7, 6);
  set(8, 8, 7);
  set(7, 8, 8);
  for (let i = 9; i < 15; i += 1) set(14 - i, 8, i);
  for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, i);
  for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, i);
};

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

const formatWeekRange = (lesson: LessonPlan) =>
  `${formatWeek(lesson.week)} from ${formatDateLabel(lesson.weekStartDate)} to ${formatDateLabel(lesson.weekEndDate)}`;

const formatDateLabel = (value?: string) => {
  if (!value) return "...";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "...";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
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
