import { LessonPlan, LessonStage, LessonStageName, RepeatableItem, WeeklyDayName, WeeklyPlanDay } from "../types/lesson";
import { uid } from "../utils/id";

export const schoolName = "KINSHASA CHRISTIAN SCHOOL";
export const schoolShortName = "KCS";
export const schoolDisplayName = `${schoolShortName} - ${schoolName}`;
export const schoolImage = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/kcs.jpg`;

export const stageNames: LessonStageName[] = [
  "Starter",
  "Introduction",
  "Presentation",
  "Guided Practice",
  "Independent Practice",
  "Collaborative Activity",
  "Assessment",
  "Closure",
  "Homework",
  "Reflection"
];

export const weeklyDayNames: WeeklyDayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const weeklyFocusBlueprints = [
  {
    focus: "Concept discovery",
    objective: "identify and describe",
    presentation: "Activate prior knowledge, define the central concept, and model one clear example linked to",
    practice: "Learners annotate examples, explain their first observations, and correct misconceptions with teacher support.",
    exit: "Learners state the key idea in their own words and solve one introductory item.",
    assessment: "Teacher listens for accurate vocabulary, checks notebooks, and notes learners who need reteaching.",
    homework: "Write three examples and one question connected to"
  },
  {
    focus: "Guided analysis",
    objective: "classify, compare, and explain",
    presentation: "Use worked examples to compare important features, ask probing questions, and connect evidence to",
    practice: "Learners sort examples, justify answers with a partner, and revise weak explanations.",
    exit: "Learners classify two new examples and explain the reason for each choice.",
    assessment: "Teacher checks reasoning, partner discussion, and accuracy during guided tasks.",
    homework: "Complete a short classification exercise based on"
  },
  {
    focus: "Skill development",
    objective: "construct, solve, and apply",
    presentation: "Demonstrate a step-by-step method, think aloud through common errors, and link the process to",
    practice: "Learners complete scaffolded tasks, then attempt similar items with reduced support.",
    exit: "Learners complete one independent task that shows they can use the method correctly.",
    assessment: "Teacher marks sample responses and records errors that should shape the next lesson.",
    homework: "Practise five items that require the method learned in"
  },
  {
    focus: "Independent application",
    objective: "apply, justify, and create",
    presentation: "Present a real or extended task, review success criteria, and show how strong responses use",
    practice: "Learners work independently or in pairs to create, solve, or defend a response using the week's concepts.",
    exit: "Learners submit one improved response with a short justification.",
    assessment: "Teacher reviews independence, quality of explanation, and correct transfer of learning.",
    homework: "Prepare one original example or solution connected to"
  },
  {
    focus: "Review and assessment",
    objective: "evaluate, correct, and demonstrate mastery of",
    presentation: "Review the week's learning path, address common errors, and connect the main concepts from",
    practice: "Learners complete a mixed review, correct mistakes, and explain the strategies they used.",
    exit: "Learners complete a brief assessment or reflection showing what they have mastered.",
    assessment: "Teacher uses the review or quiz to identify mastery, partial understanding, and follow-up needs.",
    homework: "Revise the week's notes and complete a final review task on"
  }
];

export const emptyItem = (value = ""): RepeatableItem => ({ id: uid("item"), value });

export const createStage = (name: LessonStageName): LessonStage => ({
  id: uid("stage"),
  name,
  duration: name === "Starter" ? "5 min" : "10 min",
  teacherActivities: "",
  studentActivities: "",
  resources: "",
  notes: "",
  attachments: [],
  images: []
});

export const createFlexibleWeeklyPlan = (subject = "", gradeClass = "", chapter = ""): WeeklyPlanDay[] => {
  const subjectLabel = subject || "the subject";
  const gradeLabel = gradeClass || "the class";
  const chapterLabel = chapter || "the selected unit";
  const concepts = splitConcepts(chapterLabel);

  return weeklyDayNames.map((day, index) => {
    const blueprint = weeklyFocusBlueprints[index];
    const concept = concepts[index] || concepts[concepts.length - 1] || chapterLabel;
    const nextConcept = concepts[index + 1] || chapterLabel;

    return {
      day,
      lesson: `${concept} - ${blueprint.focus}`,
      objectives: `By the end of the lesson, learners in ${gradeLabel} should be able to ${blueprint.objective} ${concept} in ${subjectLabel}.`,
      presentation: `${blueprint.presentation} ${concept}.`,
      guidedPractice: blueprint.practice,
      exitTicket: blueprint.exit,
      assessment: blueprint.assessment,
      homework: `${blueprint.homework} ${index < weeklyDayNames.length - 1 ? nextConcept : chapterLabel}.`
    };
  });
};

const splitConcepts = (value: string) => {
  const parts = value
    .split(/\s*(?:\/|,|;|\band\b|\&|\+)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length ? parts : [value];
};

export const isAutoGeneratedWeeklyPlan = (weeklyPlan?: Partial<WeeklyPlanDay>[], subject = "", gradeClass = "", chapter = "") => {
  if (!weeklyPlan?.length) return true;

  const text = weeklyPlan
    .map((day) => Object.entries(day || {})
      .filter(([key]) => key !== "day")
      .map(([, value]) => (typeof value === "string" ? value : ""))
      .join(" "))
    .join(" ")
    .trim();

  if (!text) return true;

  const hasGenericPlaceholder = ["the selected unit", "the subject", "the class"].some((marker) => text.includes(marker));
  if (hasGenericPlaceholder) return true;

  const expected = createFlexibleWeeklyPlan(subject, gradeClass, chapter);
  const editableKeys: (keyof Omit<WeeklyPlanDay, "day">)[] = [
    "lesson",
    "objectives",
    "presentation",
    "guidedPractice",
    "exitTicket",
    "assessment",
    "homework"
  ];

  return expected.every((expectedDay, index) => {
    const currentDay = weeklyPlan[index] || {};
    return editableKeys.every((key) => !currentDay[key] || currentDay[key] === expectedDay[key]);
  });
};

export const createAutomaticLessonSupport = (subject = "", gradeClass = "", chapter = "") => {
  const subjectLabel = subject || "the subject";
  const gradeLabel = gradeClass || "the class";
  const chapterLabel = chapter || "the selected unit";

  return {
    learningObjectives: [
      `Identify the main ideas and skills connected to ${chapterLabel}.`,
      `Apply ${subjectLabel} concepts through guided and independent practice.`,
      `Demonstrate understanding through oral responses, written work, and an exit task.`
    ],
    learningOutcomes: [
      `Learners in ${gradeLabel} can explain the focus of ${chapterLabel}.`,
      `Learners can complete practice tasks with increasing accuracy.`
    ],
    successCriteria: [
      "Learners participate actively during modelling and practice.",
      "Learners complete classwork with correct reasoning or explanation.",
      "Learners show understanding in the exit ticket or homework task."
    ],
    vocabulary: `${chapterLabel}; key terms; examples; practice language`,
    materialsResources: "Board, markers, notebooks, textbook or reference material, teacher examples, practice exercises",
    differentiation: "Provide guided examples, peer support, extra scaffolding for struggling learners, and extension tasks for fast finishers.",
    assessment: "Teacher checks participation, oral responses, written practice, exit tickets, homework, and common errors.",
    reflection: "Review learner responses after the lesson and adjust the next lesson according to common needs."
  };
};

export const createPdfExampleWeeklyPlan = (): WeeklyPlanDay[] => [
  {
    day: "Monday",
    lesson: "Types of Sentences / Subjects and Predicates",
    objectives: "Write, identify, and punctuate declarative, imperative, interrogative, and exclamatory sentences.",
    presentation: "Explain the four types of sentences, then introduce subject and predicate using examples.",
    guidedPractice: "Learners identify sentence types, subjects, and predicates in model sentences.",
    exitTicket: "Learners write one example for each sentence type.",
    assessment: "Observe participation and mark written exercises.",
    homework: "Write eight sentences: 2 declarative, 2 interrogative, 2 imperative and 2 exclamatory. Underline the subject and circle the predicate."
  },
  {
    day: "Tuesday",
    lesson: "Compound Subjects and Predicates / Compound Sentences",
    objectives: "Identify compound subjects and predicates. Distinguish simple and compound sentences. Write compound sentences using coordinating conjunctions.",
    presentation: "Teach compound subjects, compound predicates, and compound sentences with examples.",
    guidedPractice: "Learners identify and create compound sentences.",
    exitTicket: "Learners combine two simple sentences with a coordinating conjunction.",
    assessment: "Check correct use of coordinating conjunctions and sentence punctuation.",
    homework: "Write 10 compound sentences using different coordinating conjunctions."
  },
  {
    day: "Wednesday",
    lesson: "Subordinating Conjunctions / Complex Sentences",
    objectives: "Identify subordinating conjunctions such as because, although, if, and when. Use subordinating conjunctions in sentences.",
    presentation: "Explain that subordinating conjunctions introduce a subordinate clause and connect it to a main clause.",
    guidedPractice: "Learners join clauses using subordinating conjunctions.",
    exitTicket: "What is a subordinating conjunction? What is a complex sentence? Give one example of each.",
    assessment: "Evaluate ability to form complex sentences and participate in class activities.",
    homework: "Write 10 complex sentences using different subordinating conjunctions."
  },
  {
    day: "Thursday",
    lesson: "Simple, Compound, and Complex Sentences / Prepositions",
    objectives: "Identify, differentiate, and construct simple, compound, and complex sentences.",
    presentation: "Explain the three sentence types and introduce common prepositions such as in, on, under, behind, between, and at.",
    guidedPractice: "Learners write 3 simple, 3 compound, and 3 complex sentences.",
    exitTicket: "What are the three types of sentences? Give examples.",
    assessment: "Teacher checks written exercises.",
    homework: "Write 10 mixed sentences and identify their types."
  },
  {
    day: "Friday",
    lesson: "Prepositional Phrases / Chapter 1 Review",
    objectives: "Identify and use prepositions and prepositional phrases.",
    presentation: "Explain that a prepositional phrase is made of a preposition and its object.",
    guidedPractice: "Learners identify prepositional phrases in sentences and write original examples.",
    exitTicket: "What is a preposition? Give examples.",
    assessment: "First test / chapter review.",
    homework: "Write 10 sentences using different prepositions and prepositional phrases."
  }
];

export const createBlankLesson = (lessonNumber: string): LessonPlan => {
  const now = new Date().toISOString();
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const weekStartDate = toIsoDate(addDays(today, -((today.getDay() + 6) % 7)));
  const weekEndDate = toIsoDate(addDays(new Date(`${weekStartDate}T00:00:00`), 4));

  return {
    id: uid("lesson"),
    ownerId: "",
    ownerName: "",
    department: "",
    lessonNumber,
    planType: "weekly",
    status: "draft",
    tags: [],
    schoolName: schoolDisplayName,
    schoolYear: `${currentYear}-${currentYear + 1}`,
    semester: "1st",
    quarter: "1st",
    chapter: "",
    teachers: "",
    subject: "",
    gradeClass: "",
    date: new Date().toISOString().slice(0, 10),
    week: "1",
    weekStartDate,
    weekEndDate,
    term: "1st Quarter",
    duration: "45 min",
    classroom: "",
    numberOfStudents: "",
    topic: "",
    subtopic: "",
    referenceBook: "",
    learningArea: "",
    biblicalIntegration: "",
    crossCurricularConnections: "",
    learningObjectives: [emptyItem()],
    learningOutcomes: [emptyItem()],
    successCriteria: [emptyItem()],
    materialsResources: [emptyItem()],
    vocabulary: [emptyItem()],
    safetyConsiderations: [emptyItem()],
    stages: stageNames.map(createStage),
    blooms: {
      remember: [""],
      understand: [""],
      apply: [""],
      analyze: [""],
      evaluate: [""],
      create: [""]
    },
    differentiation: {
      strugglingLearners: "",
      eslSupport: "",
      giftedLearners: "",
      specialNeeds: "",
      inclusiveStrategies: ""
    },
    assessment: {
      diagnostic: "",
      formative: "",
      summative: "",
      observationChecklist: "",
      rubric: "",
      exitTicket: "",
      teacherComments: ""
    },
    reflection: {
      whatWentWell: "",
      challenges: "",
      improvements: "",
      followUpActivities: "",
      teacherNotes: ""
    },
    weeklyPlan: createFlexibleWeeklyPlan(),
    createdAt: now,
    updatedAt: now,
    activityLogs: [],
    revisionNotes: [],
    reviewerComments: [],
    revisionRequests: [],
    approvalHistory: [],
    workflowHistory: [],
    versions: []
  };
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
