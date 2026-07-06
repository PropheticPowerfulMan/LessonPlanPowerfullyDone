import { useCallback, useMemo, useState } from "react";
import { createBlankLesson } from "../data/defaults";
import { lessonRepository } from "../services/lessonRepository";
import { LessonPlan } from "../types/lesson";

export const useLessons = () => {
  const [lessons, setLessons] = useState<LessonPlan[]>(() => lessonRepository.list());

  const refresh = useCallback(() => setLessons(lessonRepository.list()), []);

  const nextLessonNumber = useMemo(() => {
    const year = new Date().getFullYear();
    return `LP-${year}-${String(lessons.length + 1).padStart(4, "0")}`;
  }, [lessons.length]);

  const createLesson = useCallback(() => {
    const lesson = createBlankLesson(nextLessonNumber);
    lessonRepository.save(lesson);
    refresh();
    return lesson;
  }, [nextLessonNumber, refresh]);

  const saveLesson = useCallback(
    (lesson: LessonPlan) => {
      lessonRepository.save(lesson);
      refresh();
    },
    [refresh]
  );

  return { lessons, refresh, createLesson, saveLesson };
};
