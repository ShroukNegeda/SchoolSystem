import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { AddStudentForm, DeleteStudentButton } from "@/components/StudentForms";
import ScoreCell from "@/components/ScoreCell";
import {
  saveWeeklyGradeAction, saveMonthlyExamAction, saveTermFinalExamAction,
  saveActivityScoreAction, addStudentAction, deleteStudentAction,
} from "@/lib/actions/teacher";
import {
  gradeSectionLabel, SUBJECT_LABELS, WEEKS_IN_TERM, WEEK_MAX,
  TERM_LABELS, termFinalExamLabel, TERM_FINAL_EXAM_MAX, slugToYear,
} from "@/lib/constants";
import { computeStudentResult, formatPercent } from "@/lib/grading";
import type { Prisma, Term } from "@prisma/client";

type FileWithStudents = Prisma.ClassFileGetPayload<{
  include: {
    students: {
      include: {
        weeklyGrades: true;
        monthlyExams: true;
        termFinalExam: true;
        activityScore: true;
      };
    };
  };
}>;

export default async function TeacherClassFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ yearSlug: string; term: string; classFileId: string }>;
  searchParams: Promise<{ tab?: string; week?: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { yearSlug, term: termParam, classFileId } = await params;
  const sp = await searchParams;
  const academicYear = slugToYear(yearSlug);
  const term = termParam as Term;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const file = await prisma.classFile.findFirst({
    where: { id: classFileId, teacherId: session.userId },
    include: {
      students: {
        orderBy: { order: "asc" },
        include: { weeklyGrades: true, monthlyExams: true, termFinalExam: true, activityScore: true },
      },
    },
  });
  if (!file) notFound();

  const isActivity = file.subject === "ACTIVITY";
  const tab  = sp.tab === "exams" ? "exams" : sp.tab === "summary" ? "summary" : "weekly";
  const week = Math.min(WEEKS_IN_TERM, Math.max(1, Number(sp.week) || 1));
  const backPath = `/teacher/${yearSlug}/${term}`;

  return (
    <DashboardShell name={user.name} role="TEACHER">
      <Link href={backPath} className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لفصول {TERM_LABELS[term]}
      </Link>

      <div className="mt-3 mb-5">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--color-primary-dark)]">
          {gradeSectionLabel(file.grade, file.section)}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {SUBJECT_LABELS[file.subject]} · {TERM_LABELS[term]} · {academicYear} · {file.students.length} طالب
        </p>
      </div>

      {/* إضافة طالب */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
        <h2 className="font-display font-bold mb-3 text-sm">إضافة طالب</h2>
        <AddStudentForm action={addStudentAction} hidden={{ classFileId: file.id }} />
      </section>

      {/* تبويبات */}
      {!isActivity && (
        <div className="flex gap-1 sm:gap-2 mb-5 border-b border-[var(--color-border)] overflow-x-auto">
          {[
            { key: "weekly",  label: "الأسبوعية" },
            { key: "exams",   label: "الامتحانات" },
            { key: "summary", label: "الإجمالى" },
          ].map((t) => (
            <Link key={t.key} href={`?tab=${t.key}`}
              className={`px-3 sm:px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-[var(--color-primary)] text-[var(--color-primary-dark)]"
                  : "border-transparent text-[var(--color-muted)]"
              }`}>
              {t.label}
            </Link>
          ))}
        </div>
      )}

      {file.students.length === 0 ? (
        <p className="text-center text-sm text-[var(--color-muted)] py-12">
          لا يوجد طلاب مسجلون — أضفهم بالأعلى.
        </p>
      ) : isActivity ? (
        <ActivityTable file={file} />
      ) : tab === "weekly" ? (
        <>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.from({ length: WEEKS_IN_TERM }, (_, i) => i + 1).map((w) => (
              <Link key={w} href={`?tab=weekly&week=${w}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  week === w
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                }`}>
                {w}
              </Link>
            ))}
          </div>
          <WeeklyTable file={file} week={week} />
        </>
      ) : tab === "exams" ? (
        <ExamsTable file={file} term={term} />
      ) : (
        <SummaryTable file={file} />
      )}
    </DashboardShell>
  );
}

function WeeklyTable({ file, week }: { file: FileWithStudents; week: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="bg-[var(--color-bg)] text-[var(--color-muted)]">
            <th className="text-right px-4 py-3 font-bold">الطالب</th>
            <th className="px-3 py-3 font-bold">واجب /{WEEK_MAX.homework}</th>
            <th className="px-3 py-3 font-bold">كراسة /{WEEK_MAX.notebook}</th>
            <th className="px-3 py-3 font-bold">انضباط /{WEEK_MAX.discipline}</th>
            <th className="px-3 py-3 font-bold">تقييم /{WEEK_MAX.evaluation}</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {file.students.map((s) => {
            const g = s.weeklyGrades.find((w) => w.weekNumber === week);
            const h = { classFileId: file.id, studentId: s.id, weekNumber: String(week) };
            return (
              <tr key={s.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-2.5 font-bold">{s.name}</td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveWeeklyGradeAction}
                    hidden={{ ...h, notebook: g?.notebook ?? 0, evaluation: g?.evaluation ?? 0, discipline: g?.discipline ?? 0 }}
                    name="homework" defaultValue={g?.homework ?? 0} max={WEEK_MAX.homework} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveWeeklyGradeAction}
                    hidden={{ ...h, evaluation: g?.evaluation ?? 0, discipline: g?.discipline ?? 0, homework: g?.homework ?? 0 }}
                    name="notebook" defaultValue={g?.notebook ?? 0} max={WEEK_MAX.notebook} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveWeeklyGradeAction}
                    hidden={{ ...h, notebook: g?.notebook ?? 0, evaluation: g?.evaluation ?? 0, homework: g?.homework ?? 0 }}
                    name="discipline" defaultValue={g?.discipline ?? 0} max={WEEK_MAX.discipline} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveWeeklyGradeAction}
                    hidden={{ ...h, notebook: g?.notebook ?? 0, discipline: g?.discipline ?? 0, homework: g?.homework ?? 0 }}
                    name="evaluation" defaultValue={g?.evaluation ?? 0} max={WEEK_MAX.evaluation} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <DeleteStudentButton action={deleteStudentAction}
                    hidden={{ classFileId: file.id, studentId: s.id }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExamsTable({ file, term }: { file: FileWithStudents; term: Term }) {
  const finalLabel = termFinalExamLabel(term);
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="bg-[var(--color-bg)] text-[var(--color-muted)]">
            <th className="text-right px-4 py-3 font-bold">الطالب</th>
            <th className="px-3 py-3 font-bold">شهر أكتوبر /15</th>
            <th className="px-3 py-3 font-bold">شهر نوفمبر /15</th>
            <th className="px-3 py-3 font-bold">{finalLabel} /{TERM_FINAL_EXAM_MAX}</th>
          </tr>
        </thead>
        <tbody>
          {file.students.map((s) => {
            const oct = s.monthlyExams.find((m) => m.month === "OCTOBER");
            const nov = s.monthlyExams.find((m) => m.month === "NOVEMBER");
            return (
              <tr key={s.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-2.5 font-bold">{s.name}</td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveMonthlyExamAction}
                    hidden={{ classFileId: file.id, studentId: s.id, month: "OCTOBER" }}
                    name="score" defaultValue={oct?.score ?? 0} max={15} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveMonthlyExamAction}
                    hidden={{ classFileId: file.id, studentId: s.id, month: "NOVEMBER" }}
                    name="score" defaultValue={nov?.score ?? 0} max={15} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveTermFinalExamAction}
                    hidden={{ classFileId: file.id, studentId: s.id }}
                    name="score" defaultValue={s.termFinalExam?.score ?? 0} max={TERM_FINAL_EXAM_MAX} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTable({ file }: { file: FileWithStudents }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm min-w-[320px]">
        <thead>
          <tr className="bg-[var(--color-bg)] text-[var(--color-muted)]">
            <th className="text-right px-4 py-3 font-bold">الطالب</th>
            <th className="px-3 py-3 font-bold">المجموع</th>
            <th className="px-3 py-3 font-bold">النسبة</th>
            <th className="px-3 py-3 font-bold">النتيجة</th>
          </tr>
        </thead>
        <tbody>
          {file.students.map((s) => {
            const r = computeStudentResult(file.subject, s);
            return (
              <tr key={s.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-2.5 font-bold">{s.name}</td>
                <td className="px-3 py-2.5 text-center tabular">{r.obtained} / {r.max}</td>
                <td className="px-3 py-2.5 text-center tabular">{formatPercent(r.percentage)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    r.isFail
                      ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                      : "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                  }`}>
                    {r.isFail ? "راسب" : "ناجح"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTable({ file }: { file: FileWithStudents }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm min-w-[320px]">
        <thead>
          <tr className="bg-[var(--color-bg)] text-[var(--color-muted)]">
            <th className="text-right px-4 py-3 font-bold">الطالب</th>
            <th className="px-3 py-3 font-bold">درجة النشاط /100</th>
            <th className="px-3 py-3 font-bold">النتيجة</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {file.students.map((s) => {
            const r = computeStudentResult(file.subject, s);
            return (
              <tr key={s.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-2.5 font-bold">{s.name}</td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell action={saveActivityScoreAction}
                    hidden={{ classFileId: file.id, studentId: s.id }}
                    name="score" defaultValue={s.activityScore?.score ?? 0} max={100} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    r.isFail
                      ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                      : "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                  }`}>
                    {r.isFail ? "راسب" : "ناجح"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <DeleteStudentButton action={deleteStudentAction}
                    hidden={{ classFileId: file.id, studentId: s.id }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
