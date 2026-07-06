import { LessonPlan, LessonStage, LessonStageName, RepeatableItem } from "../types/lesson";
import { uid } from "../utils/id";

export const schoolImage = "/kcs.jpg";

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

export const createBlankLesson = (lessonNumber: string): LessonPlan => {
  const now = new Date().toISOString();

  return {
    id: uid("lesson"),
    lessonNumber,
    status: "active",
    tags: [],
    schoolName: "International American School",
    teachers: "",
    subject: "",
    gradeClass: "",
    date: new Date().toISOString().slice(0, 10),
    week: "",
    term: "",
    duration: "45 min",
    classroom: "",
    numberOfStudents: "",
    topic: "",
    subtopic: "",
    referenceBook: "",
    learningArea: "",
    biblicalIntegration: "",
    crossCurricularConnections: "",
    learningObjectives: [emptyItem("Students will be able to...")],
    learningOutcomes: [emptyItem("By the end of the lesson, learners can...")],
    successCriteria: [emptyItem("I can...")],
    materialsResources: [emptyItem("Teacher device, projector, notebooks")],
    vocabulary: [emptyItem()],
    safetyConsiderations: [emptyItem("Classroom movement and digital safety expectations reviewed.")],
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
    createdAt: now,
    updatedAt: now,
    versions: []
  };
};
