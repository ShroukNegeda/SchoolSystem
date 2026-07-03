import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { lockMonthAction, unlockMonthAction } from "@/lib/actions/admin";
import { gradeSectionLabel, SUBJECT_LABELS, MONTH_GROUPS, TERM_LABELS, academicYearFromParam, TERM_OPTIONS } from "@/lib/constants";
import type { Grade, Term } from "@prisma/client";

export default async function AdminClassDetailsPage({
  params,
}: {
  params: Promise<{ year: string; term: string; grade: string; section: string }>;
}) {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const { year: yearParam, term: termParam, grade: gradeParam, section: sectionParam } = await params;
  const academicYear = academicYearFromParam(yearParam);
  const term = termParam as Term;
  const grade = gradeParam as Grade;
  const section = Number(sectionParam);

  if (!academicYear || !TERM_OPTIONS.includes(term) || !["G1", "G2", "G3"].includes(grade) || !section) {
    notFound();
  }

  const classFiles = await prisma.classFile.findMany({
    where: { grade, section, academicYear, term },
    include: { teacher: true, _count: { select: { students: true } } },
  });

  const shoonFile = await prisma.shoonClassFile.findFirst({
    where: { grade, section, academicYear, term },
    include: { students: { include: { attendance: true } } },
  });

  const monthLocks = await prisma.monthLock.findMany({
    where: { grade, section, academicYear, term },
    select: { monthLabel: true },
  });

  let absencePercent = 0;
  if (shoonFile) {
    const totalRecorded = shoonFile.students.reduce((acc, s) => acc + s.attendance.length, 0);
    const totalAbsent = shoonFile.students.reduce(
      (acc, s) => acc + s.attendance.filter((a) => a.status !== "PRESENT").length,
      0
    );
    absencePercent = totalRecorded > 0 ? (totalAbsent / totalRecorded) * 100 : 0;
  }

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link href={`/admin/classes/year/${yearParam}/term/${termParam}`} className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لكل الفصول ({academicYear} — {TERM_LABELS[term]})
      </Link>

      <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--color-primary-dark)] mt-4 mb-5">
        تفاصيل {gradeSectionLabel(grade, section)}
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ملفات درجات المواد */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="font-display font-bold text-base text-[var(--color-primary-dark)]">ملفات الدرجات (لكل مادة)</h2>
          {classFiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-10 text-center">
              <p className="text-sm text-[var(--color-muted)]">لم يقم أي مدرس برفع ملف درجات لهذا الفصل بعد.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {classFiles.map((f) => (
                <Link
                  key={f.id}
                  href={`/admin/classes/year/${yearParam}/term/${termParam}/${grade}/${section}/teacher/${f.id}`}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-5 hover:border-[var(--color-primary)] hover:shadow-xs transition-all text-right flex flex-col justify-between min-h-[120px]"
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--color-primary)]/5 text-[var(--color-primary-dark)] text-[10px] font-bold mb-2">
                      {SUBJECT_LABELS[f.subject]}
                    </span>
                    <p className="font-bold text-sm text-[var(--color-ink)]">{SUBJECT_LABELS[f.subject]}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1 font-medium">
                      المدرس: {f.teacher.name}
                    </p>
                  </div>
                  <p className="text-[10px] text-[var(--color-muted)] mt-3 border-t border-gray-100 pt-2 font-medium">
                    إجمالي الطلاب: {f._count.students} طالب
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* كشف الحضور والغياب للطلاب */}
        <section className="space-y-4">
          <h2 className="font-display font-bold text-base text-[var(--color-primary-dark)]">كشف الحضور والغياب</h2>
          {!shoonFile ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-10 text-center">
              <p className="text-sm text-[var(--color-muted)]">لم يسجل شؤون الطلبة كشف غياب لهذا الفصل بعد.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <p className="text-xs font-bold text-[var(--color-muted)]">نسبة غياب الطلاب بالفصل</p>
                <span className="font-display text-2xl font-extrabold text-[var(--color-danger)] tabular">
                  {Math.round(absencePercent * 10) / 10}%
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[var(--color-muted)] mb-3">حالة إقفال كشوف الغياب الشهرية</p>
                <div className="space-y-2">
                  {MONTH_GROUPS.map((m) => {
                    const locked = monthLocks.some((l) => l.monthLabel === m.label);
                    return (
                      <form key={m.label} action={locked ? unlockMonthAction : lockMonthAction} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                        <input type="hidden" name="grade" value={grade} />
                        <input type="hidden" name="section" value={section} />
                        <input type="hidden" name="academicYear" value={academicYear!} />
                        <input type="hidden" name="term" value={term} />
                        <input type="hidden" name="monthLabel" value={m.label} />
                        <span className="text-xs font-bold text-[var(--color-primary-dark)]">{m.label}</span>
                        <button
                          type="submit"
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                            locked
                              ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"
                              : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]"
                          }`}
                        >
                          {locked ? "فتح القفل" : "قفل الشهر"}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
