import { useCallback, useEffect, useMemo, useState } from "react";
import { createBlankLesson } from "../data/defaults";
import { useAuth } from "../contexts/AuthContext";
import { applyLessonVisibility, prepareNewLessonForUser } from "../services/permissions";
import { lessonRepository } from "../services/lessonRepository";
import { LessonPlan } from "../types/lesson";

export const useLessons = () => {
  const { currentUser } = useAuth();
  const [lessons, setLessons] = useState<LessonPlan[]>(() => applyLessonVisibility(currentUser, lessonRepository.list()));

  const refresh = useCallback(() => setLessons(applyLessonVisibility(currentUser, lessonRepository.list())), [currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const nextLessonNumber = useMemo(() => {
    const year = new Date().getFullYear();
    return `LP-${year}-${String(lessons.length + 1).padStart(4, "0")}`;
  }, [lessons.length]);

  const createLesson = useCallback(() => {
    if (!currentUser) throw new Error("A signed-in user is required to create a lesson plan");
    const lesson = prepareNewLessonForUser(createBlankLesson(nextLessonNumber), currentUser);
    lessonRepository.save(lesson);
    refresh();
    return lesson;
  }, [currentUser, nextLessonNumber, refresh]);

  const saveLesson = useCallback(
    (lesson: LessonPlan) => {
      lessonRepository.save(lesson);
      refresh();
    },
    [refresh]
  );

  return { lessons, refresh, createLesson, saveLesson };
};
