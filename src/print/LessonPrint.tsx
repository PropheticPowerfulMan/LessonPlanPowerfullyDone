import { forwardRef } from "react";
import { schoolImage } from "../data/defaults";
import { LessonPlan } from "../types/lesson";

export const LessonPrint = forwardRef<HTMLDivElement, { lesson: LessonPlan }>(({ lesson }, ref) => (
  <div ref={ref} className="print-page mx-auto overflow-hidden rounded-xl shadow-fluent">
    <img src={schoolImage} className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.045]" />
    <header className="flex items-center justify-between border-b-4 border-primary px-10 py-8">
      <div className="flex items-center gap-4">
        <img src={schoolImage} className="h-20 w-20 rounded-lg object-cover" />
        <div>
          <p className="text-2xl font-black">{lesson.schoolName}</p>
          <p className="text-sm uppercase tracking-wide text-slate-500">Professional Lesson Plan</p>
        </div>
      </div>
      <div className="text-right text-sm">
        <p className="font-bold">{lesson.lessonNumber}</p>
        <p>{lesson.date}</p>
        <p>{lesson.term} · Week {lesson.week}</p>
      </div>
    </header>
    <main className="space-y-5 px-10 py-8 text-[12px] leading-relaxed">
      <section className="grid grid-cols-4 gap-3">
        <Info label="Teacher(s)" value={lesson.teachers} />
        <Info label="Subject" value={lesson.subject} />
        <Info label="Grade/Class" value={lesson.gradeClass} />
        <Info label="Duration" value={lesson.duration} />
        <Info label="Classroom" value={lesson.classroom} />
        <Info label="Students" value={lesson.numberOfStudents} />
        <Info label="Topic" value={lesson.topic} />
        <Info label="Subtopic" value={lesson.subtopic} />
      </section>
      <Block title="Learning Area" text={lesson.learningArea} />
      <Block title="Reference Book" text={lesson.referenceBook} />
      <ListBlock title="Learning Objectives" items={lesson.learningObjectives.map((item) => item.value)} />
      <ListBlock title="Learning Outcomes" items={lesson.learningOutcomes.map((item) => item.value)} />
      <ListBlock title="Success Criteria" items={lesson.successCriteria.map((item) => item.value)} />
      <ListBlock title="Materials & Resources" items={lesson.materialsResources.map((item) => item.value)} />
      <Block title="Biblical Integration" text={lesson.biblicalIntegration || "N/A"} />
      <Block title="Cross-Curricular Connections" text={lesson.crossCurricularConnections} />
      <section>
        <h3 className="mb-2 border-b text-base font-black">Lesson Stages</h3>
        <div className="space-y-3">
          {lesson.stages.map((stage) => (
            <div key={stage.id} className="break-inside-avoid rounded-lg border p-3">
              <div className="mb-2 flex justify-between font-bold">
                <span>{stage.name}</span>
                <span>{stage.duration}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Block title="Teacher Activities" text={stage.teacherActivities} compact />
                <Block title="Student Activities" text={stage.studentActivities} compact />
                <Block title="Resources" text={stage.resources} compact />
                <Block title="Notes" text={stage.notes} compact />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid grid-cols-2 gap-4 break-inside-avoid">
        <Block title="Differentiation" text={Object.entries(lesson.differentiation).map(([k, v]) => `${labelize(k)}: ${v}`).join("\n")} />
        <Block title="Assessment" text={Object.entries(lesson.assessment).map(([k, v]) => `${labelize(k)}: ${v}`).join("\n")} />
      </section>
      <section className="grid grid-cols-2 gap-8 pt-10 text-center">
        <div className="border-t pt-2">Teacher Signature / Date</div>
        <div className="border-t pt-2">Principal Signature / Date</div>
      </section>
    </main>
    <footer className="absolute bottom-0 left-0 right-0 flex justify-between border-t px-10 py-4 text-[10px] text-slate-500">
      <span>{lesson.schoolName}</span>
      <span>Page <span className="pageNumber" /> · Powerful Lesson Planner</span>
    </footer>
  </div>
));

LessonPrint.displayName = "LessonPrint";

const Info = ({ label, value }: { label: string; value?: string }) => (
  <div className="rounded-md border p-2">
    <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
    <p className="font-semibold">{value || "N/A"}</p>
  </div>
);

const Block = ({ title, text, compact = false }: { title: string; text?: string; compact?: boolean }) => (
  <div className={compact ? "" : "break-inside-avoid"}>
    <h3 className="font-black">{title}</h3>
    <p className="whitespace-pre-line text-slate-700">{text || "N/A"}</p>
  </div>
);

const ListBlock = ({ title, items }: { title: string; items: string[] }) => (
  <div className="break-inside-avoid">
    <h3 className="font-black">{title}</h3>
    <ul className="ml-5 list-disc">
      {items.filter(Boolean).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
    </ul>
  </div>
);

const labelize = (value: string) => value.replace(/[A-Z]/g, (match) => ` ${match}`).replace(/^./, (match) => match.toUpperCase());
