import { CurriculumFilters, CurriculumInput, CurriculumItem } from "../types/curriculum";
import { uid } from "../utils/id";

const key = "powerful-lesson-planner:curriculum";
const versionKey = "powerful-lesson-planner:curriculum-version";
const version = "1";

const seedItems: CurriculumInput[] = [
  {
    academicYear: "2026-2027",
    term: "1st Quarter",
    grade: "Grade 4",
    subject: "English",
    unit: "Grammar Foundations",
    topic: "Types of Sentences",
    subtopic: "Subjects and Predicates",
    competencies: ["Communicates using complete sentences", "Identifies sentence purpose and structure"],
    learningObjectives: ["Identify declarative, interrogative, imperative, and exclamatory sentences.", "Underline subjects and circle predicates in model sentences."],
    learningOutcomes: ["Learners classify sentence types accurately.", "Learners write complete sentences with clear subjects and predicates."],
    references: ["KCS English Scope and Sequence", "Grammar workbook chapter 1"],
    skills: ["Writing", "Grammar analysis", "Oral response"],
    curriculumStandards: ["ENG-G4-L1", "ENG-G4-W2"]
  },
  {
    academicYear: "2026-2027",
    term: "1st Quarter",
    grade: "Grade 5",
    subject: "Mathematics",
    unit: "Number Sense",
    topic: "Fractions",
    subtopic: "Equivalent Fractions",
    competencies: ["Models fractions visually", "Explains equivalence using multiplication and division"],
    learningObjectives: ["Generate equivalent fractions using models and number patterns.", "Compare fractions with related denominators."],
    learningOutcomes: ["Learners create equivalent fractions correctly.", "Learners justify fraction comparisons using evidence."],
    references: ["KCS Math Curriculum Map", "Math textbook unit 2"],
    skills: ["Reasoning", "Problem solving", "Mathematical communication"],
    curriculumStandards: ["MATH-G5-NF1", "MATH-G5-NF2"]
  },
  {
    academicYear: "2026-2027",
    term: "1st Quarter",
    grade: "K5",
    subject: "Science",
    unit: "Living Things",
    topic: "Plants",
    subtopic: "Parts of a Plant",
    competencies: ["Observes and names plant parts", "Connects plant parts to their functions"],
    learningObjectives: ["Identify roots, stems, leaves, flowers, and seeds.", "Explain one function of each main plant part."],
    learningOutcomes: ["Learners label a simple plant diagram.", "Learners describe how plants grow and survive."],
    references: ["KCS Early Years Science Guide", "Teacher picture cards"],
    skills: ["Observation", "Classification", "Speaking"],
    curriculumStandards: ["SCI-K5-LS1"]
  }
];

const now = () => new Date().toISOString();

const createItem = (input: CurriculumInput): CurriculumItem => {
  const timestamp = now();
  return { ...input, id: uid("curriculum"), createdAt: timestamp, updatedAt: timestamp };
};

const seed = () => {
  const items = seedItems.map(createItem);
  localStorage.setItem(key, JSON.stringify(items));
  localStorage.setItem(versionKey, version);
  return items;
};

const read = (): CurriculumItem[] => {
  try {
    if (localStorage.getItem(versionKey) !== version) return seed();
    const items = JSON.parse(localStorage.getItem(key) || "[]") as CurriculumItem[];
    return items.length ? items.map(normalizeItem) : seed();
  } catch {
    return seed();
  }
};

const write = (items: CurriculumItem[]) => localStorage.setItem(key, JSON.stringify(items.map(normalizeItem)));

const normalizeItem = (item: Partial<CurriculumItem>): CurriculumItem => {
  const fallback = createItem(seedItems[0]);
  return {
    ...fallback,
    ...item,
    id: item.id || uid("curriculum"),
    competencies: toList(item.competencies),
    learningObjectives: toList(item.learningObjectives),
    learningOutcomes: toList(item.learningOutcomes),
    references: toList(item.references),
    skills: toList(item.skills),
    curriculumStandards: toList(item.curriculumStandards),
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now()
  };
};

const toList = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];

export const curriculumRepository = {
  list: read,
  get(id: string) {
    return read().find((item) => item.id === id);
  },
  save(input: CurriculumItem | CurriculumInput) {
    const items = read();
    const timestamp = now();
    const item = "id" in input
      ? normalizeItem({ ...input, updatedAt: timestamp })
      : createItem(input);
    const next = items.some((current) => current.id === item.id)
      ? items.map((current) => (current.id === item.id ? item : current))
      : [item, ...items];
    write(next);
    return item;
  },
  remove(id: string) {
    write(read().filter((item) => item.id !== id));
  },
  import(items: CurriculumItem[]) {
    write(items.map(normalizeItem));
  },
  exportJson() {
    return JSON.stringify(read(), null, 2);
  }
};

export const filterCurriculum = (items: CurriculumItem[], filters: CurriculumFilters) => {
  const query = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    const haystack = [
      item.academicYear,
      item.term,
      item.grade,
      item.subject,
      item.unit,
      item.topic,
      item.subtopic,
      item.competencies.join(" "),
      item.learningObjectives.join(" "),
      item.learningOutcomes.join(" "),
      item.references.join(" "),
      item.skills.join(" "),
      item.curriculumStandards.join(" ")
    ].join(" ").toLowerCase();

    return (
      (!query || haystack.includes(query)) &&
      (!filters.academicYear || item.academicYear === filters.academicYear) &&
      (!filters.term || item.term === filters.term) &&
      (!filters.grade || item.grade === filters.grade) &&
      (!filters.subject || item.subject === filters.subject)
    );
  });
};

export const findCurriculumSuggestions = (items: CurriculumItem[], grade = "", subject = "") =>
  items.filter((item) =>
    (!grade || item.grade.toLowerCase() === grade.toLowerCase()) &&
    (!subject || item.subject.toLowerCase() === subject.toLowerCase())
  );
