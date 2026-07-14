import { LessonPlan, WeeklyPlanDay } from "../types/lesson";
import { getProgressionDay } from "./weeklyProgressionService";

export interface DurationWarning {
  id: string;
  message: string;
}

export const getActivityDurations = (day: WeeklyPlanDay, index: number) => {
  const defaults = getProgressionDay(index).defaultDurations;
  const introduction = day.activityDurations?.introduction ?? Math.max(5, Math.round((defaults.presentation + defaults.guidedPractice + defaults.exitTicket) * 0.15));
  return {
    introduction,
    presentation: day.activityDurations?.presentation ?? defaults.presentation,
    guidedPractice: day.activityDurations?.guidedPractice ?? defaults.guidedPractice,
    exitTicket: day.activityDurations?.exitTicket ?? defaults.exitTicket
  };
};

export const distributeActivityDurations = (totalMinutes: number, day: WeeklyPlanDay, index: number) => {
  const current = getActivityDurations(day, index);
  const currentTotal = current.introduction + current.presentation + current.guidedPractice + current.exitTicket;
  const source = currentTotal > 0 ? current : getActivityDurations({ ...day, activityDurations: undefined }, index);
  const sourceTotal = source.introduction + source.presentation + source.guidedPractice + source.exitTicket || 1;
  const introduction = Math.max(0, Math.round((totalMinutes * source.introduction) / sourceTotal));
  const presentation = Math.max(0, Math.round((totalMinutes * source.presentation) / sourceTotal));
  const guidedPractice = Math.max(0, Math.round((totalMinutes * source.guidedPractice) / sourceTotal));
  const exitTicket = Math.max(0, totalMinutes - introduction - presentation - guidedPractice);

  return {
    introduction,
    presentation,
    guidedPractice,
    exitTicket
  };
};

export const analyzeDurationAllocation = (lesson: LessonPlan): DurationWarning[] => {
  const stated = parseMinutes(lesson.duration);
  if (!stated) return [];
  return (lesson.weeklyPlan || []).map((day, index) => {
    const durations = getActivityDurations(day, index);
    const total = durations.introduction + durations.presentation + durations.guidedPractice + durations.exitTicket;
    const diff = stated - total;
    if (Math.abs(diff) < 5) return undefined;
    return {
      id: `${day.day}-duration`,
      message: diff > 0 ? `${day.day}: ${diff} minutes unallocated.` : `${day.day}: activities exceed lesson duration by ${Math.abs(diff)} minutes.`
    };
  }).filter(Boolean) as DurationWarning[];
};

export const parseMinutes = (value?: string) => {
  if (!value) return 0;
  const text = value.toLowerCase().replace(/\s+/g, "");
  const hourMatch = text.match(/^(\d+)h(?:(\d+))?$/);
  if (hourMatch) return Number(hourMatch[1]) * 60 + Number(hourMatch[2] || 0);
  const minMatch = text.match(/(\d+)/);
  return minMatch ? Number(minMatch[1]) : 0;
};
