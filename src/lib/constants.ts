import type { Grade, SubjectName, AttendanceStatus, ExamMonth, Role, Term } from "@prisma/client";

export const GRADE_LABELS: Record<Grade, string> = {
  G1: "الصف الأول الإعدادى",
  G2: "الصف الثانى الإعدادى",
  G3: "الصف الثالث الإعدادى",
};

export const GRADE_OPTIONS: Grade[] = ["G1", "G2", "G3"];

export const SECTION_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export const SUBJECT_LABELS: Record<SubjectName, string> = {
  ARABIC: "اللغة العربية",
  ENGLISH: "اللغة الإنجليزية",
  STUDIES: "الدراسات",
  MATH: "الرياضة",
  SCIENCE: "العلوم",
  ART: "التربية الفنية",
  RELIGION: "التربية الدينية",
  COMPUTER: "الحاسب الآلى",
  ACTIVITY: "النشاط",
};

export const SUBJECT_OPTIONS: SubjectName[] = [
  "ARABIC",
  "ENGLISH",
  "STUDIES",
  "MATH",
  "SCIENCE",
  "ART",
  "RELIGION",
  "COMPUTER",
  "ACTIVITY",
];

export const ROLE_LABELS: Record<Role, string> = {
  TEACHER: "مدرس مادة",
  SHOON: "شؤون الطلبة",
  ADMIN: "المدير",
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "حاضر",
  EXCUSED_ABSENCE: "غائب بعذر",
  UNEXCUSED_ABSENCE: "غائب بدون عذر",
};

export const EXAM_MONTH_LABELS: Record<ExamMonth, string> = {
  OCTOBER: "شهر أكتوبر",
  NOVEMBER: "شهر نوفمبر",
};

export const WEEKS_IN_TERM = 12;

// تقسيم أسابيع الترم على 3 شهور لغرض القفل الشهرى من المدير
export const MONTH_GROUPS: { label: string; weeks: number[] }[] = [
  { label: "الشهر الأول", weeks: [1, 2, 3, 4] },
  { label: "الشهر الثانى", weeks: [5, 6, 7, 8] },
  { label: "الشهر الثالث", weeks: [9, 10, 11, 12] },
];

export function monthLabelForWeek(week: number): string {
  return MONTH_GROUPS.find((m) => m.weeks.includes(week))?.label ?? MONTH_GROUPS[0].label;
}

export const WEEK_MAX = { notebook: 10, evaluation: 20, discipline: 10, homework: 10 };
export const WEEK_TOTAL_MAX = WEEK_MAX.notebook + WEEK_MAX.evaluation + WEEK_MAX.discipline + WEEK_MAX.homework; // 50
export const MONTHLY_EXAM_MAX = 15;
export const TERM_FINAL_EXAM_MAX = 30; // نص العام (ترم 1) أو آخر العام (ترم 2)
export const ACTIVITY_MAX = 100;

// المجموع الكلى للترم لمادة عادية: 12 أسبوع * 50 + امتحانين شهريين (15 لكل واحد) + امتحان نص/آخر العام (30)
export const TERM_TOTAL_MAX =
  WEEKS_IN_TERM * WEEK_TOTAL_MAX + MONTHLY_EXAM_MAX * 2 + TERM_FINAL_EXAM_MAX; // 660

export function passThreshold(subject: SubjectName): number {
  // مادة الدين تستلزم 70% للنجاح، باقى المواد 50%
  return subject === "RELIGION" ? 0.7 : 0.5;
}

export function gradeSectionLabel(grade: Grade, section: number) {
  return `${GRADE_LABELS[grade]} - فصل ${section}`;
}

// ------------------------- السنة الدراسية والترم -------------------------

export const TERM_LABELS: Record<Term, string> = {
  TERM1: "الترم الأول",
  TERM2: "الترم الثانى",
};

export const TERM_OPTIONS: Term[] = ["TERM1", "TERM2"];

// اسم الامتحان الختامى يختلف حسب الترم: نص العام فى الأول، آخر العام فى الثانى
export function termFinalExamLabel(term: Term): string {
  return term === "TERM1" ? "امتحان نص العام" : "امتحان آخر العام";
}

// السنة الدراسية الافتراضية الحالية بناءً على تاريخ اليوم
// (العام الدراسى المصرى يبدأ غالبًا فى سبتمبر)
export function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-12
  return m >= 9 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

// السنة الدراسية التالية لسنة معينة، مثال: "2026/2027" -> "2027/2028"
export function nextAcademicYear(year: string): string {
  const match = year.match(/(\d{4})\s*\/\s*(\d{4})/);
  if (!match) return year;
  const start = Number(match[1]);
  return `${start + 1}/${start + 2}`;
}

export function yearTermLabel(academicYear: string, term: Term) {
  return `${academicYear} — ${TERM_LABELS[term]}`;
}

// ---- مساعدات URL ----
// "2025/2026"  →  "2025-2026"
export function yearToSlug(year: string): string {
  return year.replace("/", "-");
}
// "2025-2026"  →  "2025/2026"
export function slugToYear(slug: string): string {
  return slug.replace("-", "/");
}
// قائمة بالسنوات المتاحة للاختيار: السنة الحالية ثم السنوات القادمة فقط
export function availableYears(): string[] {
  const current = currentAcademicYear();
  const startYear = Number(current.split("/")[0]);
  const years: string[] = [];
  for (let y = startYear; y <= startYear + 8; y++) {
    years.push(`${y}/${y + 1}`);
  }
  return years;
}

export const ACADEMIC_YEAR_OPTIONS = availableYears();

export function normalizeAcademicYear(year?: string): string {
  if (!year) return currentAcademicYear();
  const match = year.match(/^\d{4}\/\d{4}$/);
  return match ? year : currentAcademicYear();
}

export function normalizeTerm(term?: string): Term {
  if (term === "TERM1" || term === "TERM2") return term;
  if (term === "1") return "TERM1";
  if (term === "2") return "TERM2";
  return "TERM1";
}

export function academicYearFromParam(slug: string): string | null {
  const year = slugToYear(slug);
  const match = year.match(/^\d{4}\/\d{4}$/);
  return match ? year : null;
}

export function getCurrentAcademicYear(): string {
  return currentAcademicYear();
}
