import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { AddStudentForm, DeleteStudentButton } from "@/components/StudentForms";
import AttendanceCell from "@/components/AttendanceCell";
import {
  addShoonStudentAction,
  deleteShoonStudentAction,
  saveAttendanceAction,
} from "@/lib/actions/shoon";
import {
  gradeSectionLabel,
  WEEKS_IN_TERM,
  TERM_LABELS,
  monthLabelForWeek,
  slugToYear,
} from "@/lib/constants";
import type { Term } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ShoonClassFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ yearSlug: string; term: string; fileId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireRole("SHOON");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) redirect("/login");

  const { yearSlug, term: termParam, fileId } = await params;
  const sp = await searchParams;

  if (!["TERM1", "TERM2"].includes(termParam)) {
    notFound();
  }

  const term = termParam as Term;
  const academicYear = slugToYear(yearSlug);

  const file = await prisma.shoonClassFile.findFirst({
    where: {
      id: fileId,
      shoonId: session.userId,
    },
    include: {
      students: {
        orderBy: { order: "asc" },
        include: { attendance: true },
      },
    },
  });

  if (!file) {
    notFound();
  }

  const week = Math.min(WEEKS_IN_TERM, Math.max(1, Number(sp.week) || 1));
  const monthLabel = monthLabelForWeek(week);

  const locks = await prisma.monthLock.findMany({
    where: { grade: file.grade, section: file.section, academicYear: file.academicYear, term: file.term },
    select: { monthLabel: true },
  });

  const isLocked = locks.some((l) => l.monthLabel === monthLabel);
  const anyLocked = locks.length > 0;

  const totalRecorded = file.students.reduce(
    (acc, s) => acc + s.attendance.length,
    0
  );

  const totalAbsent = file.students.reduce(
    (acc, s) =>
      acc +
      s.attendance.filter(
        (a) => a.status !== "PRESENT"
      ).length,
    0
  );

  const absencePercent =
    totalRecorded > 0
      ? (totalAbsent / totalRecorded) * 100
      : 0;

  return (
    <DashboardShell name={user.name} role="SHOON">
      <Link
        href={`/shoon/${yearSlug}/${term}`}
        className="text-sm text-[var(--color-muted)] hover:underline"
      >
        ← الرجوع لكشوف {TERM_LABELS[term]}
      </Link>

      <div className="mt-3 mb-5">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--color-primary-dark)]">
          {gradeSectionLabel(file.grade, file.section)}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {TERM_LABELS[term]} · {academicYear} · {file.students.length} طالب
        </p>
      </div>

      {!isLocked && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
          <h2 className="font-display font-bold mb-3 text-sm">
            إضافة طالب
          </h2>

          <AddStudentForm
            action={addShoonStudentAction}
            hidden={{ fileId: file.id }}
          />
        </section>
      )}

      {file.students.length === 0 ? (
        <p className="text-center text-sm text-[var(--color-muted)] py-12">
          لا يوجد طلاب — أضفهم بالأعلى.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Array.from({ length: WEEKS_IN_TERM }, (_, i) => i + 1).map((w) => (
              <Link
                key={w}
                href={`?week=${w}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  week === w
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                }`}
              >
                {w}
              </Link>
            ))}
          </div>

          <p className="text-xs text-[var(--color-muted)] mb-4">
            الأسبوع {week} — {monthLabel}

            {isLocked && (
              <span className="mr-2 inline-block px-2 py-0.5 rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger)] font-bold">
                مقفول من الإدارة
              </span>
            )}
          </p>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-6">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="bg-[var(--color-bg)] text-[var(--color-muted)]">
                  <th className="text-right px-4 py-3 font-bold">
                    الطالب
                  </th>

                  <th className="px-3 py-3 font-bold">
                    الحالة
                  </th>

                  <th className="px-3 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {file.students.map((s) => {
                  const attendance =
                    s.attendance.find(
                      (x) => x.weekNumber === week
                    );

                  return (
                    <tr
                      key={s.id}
                      className="border-t border-[var(--color-border)]"
                    >
                      <td className="px-4 py-2.5 font-bold">
                        {s.name}
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <AttendanceCell
                          action={saveAttendanceAction}
                          hidden={{
                            fileId: file.id,
                            studentId: s.id,
                            weekNumber: String(week),
                          }}
                          defaultValue={
                            attendance?.status ??
                            "PRESENT"
                          }
                          disabled={isLocked}
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        {!isLocked && (
                          <DeleteStudentButton
                            action={deleteShoonStudentAction}
                            hidden={{
                              fileId: file.id,
                              studentId: s.id,
                              weekNumber: String(week),
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary)]/5 p-5 flex items-center justify-between">
            <p className="font-display font-bold text-[var(--color-primary-dark)]">
              نسبة الغياب الإجمالية
            </p>

            <p className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)] tabular">
              {Math.round(absencePercent * 10) / 10}%
            </p>
          </div>
        </>
      )}
    </DashboardShell>
  );
}