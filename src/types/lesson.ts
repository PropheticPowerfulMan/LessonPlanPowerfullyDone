export type Language = "en" | "fr";

export type LessonStageName =
  | "Starter"
  | "Introduction"
  | "Presentation"
  | "Guided Practice"
  | "Independent Practice"
  | "Collaborative Activity"
  | "Assessment"
  | "Closure"
  | "Homework"
  | "Reflection";

export type LessonStatus = "active" | "archived";

export type WeeklyDayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export interface RepeatableItem {
  id: string;
  value: string;
}

export interface LessonStage {
  id: string;
  name: LessonStageName;
  duration: string;
  teacherActivities: string;
  studentActivities: string;
  resources: string;
  notes: string;
  attachments: string[];
  images: string[];
}

export interface WeeklyPlanDay {
  day: WeeklyDayName;
  lesson: string;
  objectives: string;
  presentation: string;
  guidedPractice: string;
  exitTicket: string;
  assessment: string;
  homework: string;
}

export interface BloomQuestions {
  remember: string[];
  understand: string[];
  apply: string[];
  analyze: string[];
  evaluate: string[];
  create: string[];
}

export interface Differentiation {
  strugglingLearners: string;
  eslSupport: string;
  giftedLearners: string;
  specialNeeds: string;
  inclusiveStrategies: string;
}

export interface AssessmentPlan {
  diagnostic: string;
  formative: string;
  summative: string;
  observationChecklist: string;
  rubric: string;
  exitTicket: string;
  teacherComments: string;
}

export interface ReflectionPlan {
  whatWentWell: string;
  challenges: string;
  improvements: string;
  followUpActivities: string;
  teacherNotes: string;
}

export interface LessonVersion {
  id: string;
  savedAt: string;
  summary: string;
  snapshot: LessonPlan;
}

export interface LessonPlan {
  id: string;
  ownerId: string;
  ownerName: string;
  department: string;
  lessonNumber: string;
  status: LessonStatus;
  tags: string[];
  schoolName: string;
  schoolYear: string;
  semester: string;
  quarter: string;
  chapter: string;
  teachers: string;
  subject: string;
  gradeClass: string;
  date: string;
  week: string;
  term: string;
  duration: string;
  classroom: string;
  numberOfStudents: string;
  topic: string;
  subtopic: string;
  referenceBook: string;
  learningArea: string;
  biblicalIntegration?: string;
  crossCurricularConnections: string;
  learningObjectives: RepeatableItem[];
  learningOutcomes: RepeatableItem[];
  successCriteria: RepeatableItem[];
  materialsResources: RepeatableItem[];
  vocabulary: RepeatableItem[];
  safetyConsiderations: RepeatableItem[];
  stages: LessonStage[];
  blooms: BloomQuestions;
  differentiation: Differentiation;
  assessment: AssessmentPlan;
  reflection: ReflectionPlan;
  weeklyPlan: WeeklyPlanDay[];
  createdAt: string;
  updatedAt: string;
  versions: LessonVersion[];
}

export interface LessonFilters {
  query: string;
  teacher: string;
  subject: string;
  grade: string;
  date: string;
  topic: string;
  week: string;
  month: string;
  year: string;
  term: string;
  tags: string;
  status: "all" | LessonStatus;
}

export interface LessonTemplate {
  id: string;
  name: string;
  subject: string;
  gradeClass: string;
  learningArea: string;
  tags: string[];
  prefill: Partial<LessonPlan>;
}
