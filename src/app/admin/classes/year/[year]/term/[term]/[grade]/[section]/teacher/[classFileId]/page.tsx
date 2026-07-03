import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { gradeSectionLabel, SUBJECT_LABELS, TERM_LABELS, academicYearFromParam, TERM_OPTIONS } from "@/lib/constants";
import { computeStudentResult, formatPercent } from "@/lib/grading";
import type { Term } from "@prisma/client";

export default async function AdminClassTeacherFilePage({
  params,
}: {
  params: Promise<{ year: string; term: string; grade: string; section: string; classFileId: string }>;
}) {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const { year: yearParam, term: termParam, grade: gradeParam, section: sectionParam, classFileId } = await params;
  const academicYear = academicYearFromParam(yearParam);
  const term = termParam as Term;

  if (!academicYear || !TERM_OPTIONS.includes(term)) notFound();

  const file = await prisma.classFile.findUnique({
    where: { id: classFileId },
    include: {
      teacher: true,
      students: {
        orderBy: { order: "asc" },
        include: { weeklyGrades: true, monthlyExams: true, termFinalExam: true, activityScore: true },
      },
    },
  });

  if (!file) notFound();

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link
        href={`/admin/classes/year/${yearParam}/term/${termParam}/${gradeParam}/${sectionParam}`}
        className="text-sm text-[var(--color-muted)] hover:underline"
      >
        ← الرجوع لتفاصيل الفصل {gradeSectionLabel(file.grade, file.section)}
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          كشف درجات مادة {SUBJECT_LABELS[file.subject]}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1 font-medium">
          المدرس: {file.teacher.name} | {TERM_LABELS[term]} | السنة الدراسية: {academicYear}
        </p>
      </div>

      {file.students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-12 text-center">
          <p className="text-sm text-[var(--color-muted)]">لا يوجد طلاب مسجلين في هذا الكشف بعد.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-muted)]">
                  <th className="text-right px-5 py-3.5 font-bold">اسم الطالب</th>
                  <th className="text-center px-4 py-3.5 font-bold">الدرجة الحاصل عليها</th>
                  <th className="text-center px-4 py-3.5 font-bold">النسبة المئوية</th>
                  <th className="text-center px-4 py-3.5 font-bold">النتيجة النهائية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {file.students.map((s) => {
                  const r = computeStudentResult(file.subject, s);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[var(--color-ink)]">{s.name}</td>
                      <td className="px-4 py-3.5 text-center tabular font-medium">
                        {r.obtained} / {r.max}
                      </td>
                      <td className="px-4 py-3.5 text-center tabular font-medium text-[var(--color-muted)]">
                        {formatPercent(r.percentage)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${
                            r.isFail
                              ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/15"
                              : "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/15"
                          }`}
                        >
                          {r.isFail ? "راسب" : "ناجح"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
