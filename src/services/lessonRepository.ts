import { LessonFilters, LessonPlan } from "../types/lesson";

const key = "powerful-lesson-planner:lessons";

const read = (): LessonPlan[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as LessonPlan[];
  } catch {
    return [];
  }
};

const write = (lessons: LessonPlan[]) => {
  localStorage.setItem(key, JSON.stringify(lessons));
};

export const lessonRepository = {
  list: read,
  get(id: string) {
    return read().find((lesson) => lesson.id === id);
  },
  save(lesson: LessonPlan) {
    const lessons = read();
    const next = lessons.some((item) => item.id === lesson.id)
      ? lessons.map((item) => (item.id === lesson.id ? lesson : item))
      : [lesson, ...lessons];
    write(next);
    return lesson;
  },
  remove(id: string) {
    write(read().filter((lesson) => lesson.id !== id));
  },
  import(lessons: LessonPlan[]) {
    write(lessons);
  },
  exportJson() {
    return JSON.stringify(read(), null, 2);
  }
};

export const filterLessons = (lessons: LessonPlan[], filters: LessonFilters) => {
  const query = filters.query.trim().toLowerCase();
  const tags = filters.tags.toLowerCase().split(",").map((tag) => tag.trim()).filter(Boolean);

  return lessons.filter((lesson) => {
    const haystack = [
      lesson.schoolName,
      lesson.teachers,
      lesson.subject,
      lesson.gradeClass,
      lesson.topic,
      lesson.subtopic,
      lesson.week,
      lesson.term,
      lesson.tags.join(" "),
      lesson.learningObjectives.map((item) => item.value).join(" ")
    ].join(" ").toLowerCase();
    const month = lesson.date ? String(new Date(lesson.date).getMonth() + 1).padStart(2, "0") : "";
    const year = lesson.date ? String(new Date(lesson.date).getFullYear()) : "";

    return (
      (!query || haystack.includes(query)) &&
      (!filters.teacher || lesson.teachers.toLowerCase().includes(filters.teacher.toLowerCase())) &&
      (!filters.subject || lesson.subject.toLowerCase().includes(filters.subject.toLowerCase())) &&
      (!filters.grade || lesson.gradeClass.toLowerCase().includes(filters.grade.toLowerCase())) &&
      (!filters.date || lesson.date === filters.date) &&
      (!filters.topic || lesson.topic.toLowerCase().includes(filters.topic.toLowerCase())) &&
      (!filters.week || lesson.week === filters.week) &&
      (!filters.month || month === filters.month.padStart(2, "0")) &&
      (!filters.year || year === filters.year) &&
      (!filters.term || lesson.term.toLowerCase().includes(filters.term.toLowerCase())) &&
      (!tags.length || tags.every((tag) => lesson.tags.join(" ").toLowerCase().includes(tag))) &&
      (filters.status === "all" || lesson.status === filters.status)
    );
  });
};
