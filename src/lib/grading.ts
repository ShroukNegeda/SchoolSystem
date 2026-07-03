import {
  WEEK_TOTAL_MAX,
  MONTHLY_EXAM_MAX,
  TERM_FINAL_EXAM_MAX,
  TERM_TOTAL_MAX,
  ACTIVITY_MAX,
  WEEKS_IN_TERM,
  passThreshold,
} from "@/lib/constants";
import type { SubjectName, WeeklyGrade, MonthlyExam, TermFinalExam, ActivityScore } from "@prisma/client";

export type StudentGradeBundle = {
  weeklyGrades: WeeklyGrade[];
  monthlyExams: MonthlyExam[];
  termFinalExam: TermFinalExam | null;
  activityScore: ActivityScore | null;
};

export function computeStudentResult(subject: SubjectName, bundle: StudentGradeBundle) {
  if (subject === "ACTIVITY") {
    const score = bundle.activityScore?.score ?? 0;
    const percentage = ACTIVITY_MAX > 0 ? score / ACTIVITY_MAX : 0;
    return {
      obtained: score,
      max: ACTIVITY_MAX,
      percentage,
      isFail: percentage < passThreshold(subject),
    };
  }

  const weeksObtained = bundle.weeklyGrades.reduce(
    (sum, w) => sum + w.notebook + w.evaluation + w.discipline + w.homework,
    0
  );
  const monthlyObtained = bundle.monthlyExams.reduce((sum, m) => sum + m.score, 0);
  const finalExamObtained = bundle.termFinalExam?.score ?? 0;

  const obtained = weeksObtained + monthlyObtained + finalExamObtained;
  const max = TERM_TOTAL_MAX;
  const percentage = max > 0 ? obtained / max : 0;

  return {
    obtained,
    max,
    percentage,
    isFail: percentage < passThreshold(subject),
    weeksObtained,
    weeksMax: WEEKS_IN_TERM * WEEK_TOTAL_MAX,
    monthlyObtained,
    monthlyMax: MONTHLY_EXAM_MAX * 2,
    finalExamObtained,
    finalExamMax: TERM_FINAL_EXAM_MAX,
  };
}

export function formatPercent(p: number) {
  return `${Math.round(p * 1000) / 10}%`;
}
