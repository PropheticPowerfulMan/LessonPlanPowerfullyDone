import { LessonPlan, WeeklyPlanDay } from "../types/lesson";

export interface QualityWarning {
  id: string;
  severity: "info" | "warning";
  message: string;
}

const measurableVerbs = ["identify", "define", "list", "label", "describe", "explain", "summarize", "compare", "classify", "demonstrate", "calculate", "solve", "apply", "investigate", "analyze", "distinguish", "interpret", "justify", "evaluate", "design", "construct", "formulate", "present", "reflect", "revise", "synthesize", "assess", "create"];
const vagueWords = ["understand", "learn about", "know", "become familiar"];

export const analyzeWeeklyPlanQuality = (lesson: LessonPlan): QualityWarning[] => {
  const plan = lesson.weeklyPlan || [];
  const warnings: QualityWarning[] = [];
  checkRepeated(plan, "objectives", warnings);
  checkRepeated(plan, "assessment", warnings);
  checkRepeated(plan, "homework", warnings);

  plan.forEach((day) => {
    const objective = day.objectives.toLowerCase();
    if (vagueWords.some((word) => objective.includes(word))) {
      warnings.push({ id: `${day.day}-vague-objective`, severity: "warning", message: `${day.day} objective uses vague wording; choose measurable verbs such as explain, demonstrate, apply, or evaluate.` });
    }
    if (!measurableVerbs.some((verb) => objective.includes(verb))) {
      warnings.push({ id: `${day.day}-missing-verb`, severity: "warning", message: `${day.day} objective may be missing a measurable action verb.` });
    }
    Object.entries(day).forEach(([key, value]) => {
      if (key !== "day" && typeof value === "string" && value.length > 260) {
        warnings.push({ id: `${day.day}-${key}-long`, severity: "info", message: `${day.day} ${label(key)} may be too long for a clean one-page print.` });
      }
    });
  });

  return warnings.slice(0, 8);
};

type TextWeeklyKey = keyof Omit<WeeklyPlanDay, "day" | "activityDurations" | "lockedFields" | "editedFields">;

const checkRepeated = (plan: WeeklyPlanDay[], key: TextWeeklyKey, warnings: QualityWarning[]) => {
  const normalized = plan.map((day) => day[key]?.trim().toLowerCase()).filter(Boolean);
  if (new Set(normalized).size < normalized.length) {
    warnings.push({ id: `${key}-repeated`, severity: "warning", message: `Some ${label(key)} entries repeat across days; regenerate the row or edit the repeated cells.` });
  }
};

const label = (key: string) => key.replace(/([A-Z])/g, " $1").toLowerCase();
