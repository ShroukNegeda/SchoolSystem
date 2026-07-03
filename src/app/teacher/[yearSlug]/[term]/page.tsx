import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { createClassFileAction } from "@/lib/actions/teacher";
import {
  slugToYear, TERM_LABELS, GRADE_OPTIONS, GRADE_LABELS,
  SECTION_OPTIONS, SUBJECT_LABELS, gradeSectionLabel,
} from "@/lib/constants";
import type { Term } from "@prisma/client";

export default async function TeacherTermPage({
  params,
}: {
  params: Promise<{ yearSlug: string; term: string }>;
}) {
  const session = await requireRole("TEACHER");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  const { yearSlug, term: termParam } = await params;

  if (!["TERM1", "TERM2"].includes(termParam)) notFound();
  const term = termParam as Term;
  const academicYear = slugToYear(yearSlug);

  const files = await prisma.classFile.findMany({
    where: { teacherId: session.userId, academicYear, term },
    include: { _count: { select: { students: true } } },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  // إذا كان ترم 2، هل يوجد ترم 1 كأساس لنقل الأسماء؟
  const term1Count =
    term === "TERM2"
      ? await prisma.classFile.count({
          where: { teacherId: session.userId, academicYear, term: "TERM1" },
        })
      : 0;

  return (
    <DashboardShell name={user.name} role="TEACHER">
      <Link href={`/teacher/${yearSlug}`} className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لاختيار الترم
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          {TERM_LABELS[term]} — {academicYear}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          مادة {user.subject ? SUBJECT_LABELS[user.subject] : "—"}
          {term === "TERM2" && term1Count > 0 && (
            <span className="mr-2 text-[var(--color-success)] font-bold">
              · أسماء الطلاب ستُنقل تلقائيًا من الترم الأول
            </span>
          )}
        </p>
      </div>

      {/* نموذج إنشاء فصل جديد */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-8">
        <h2 className="font-display font-bold mb-4">إنشاء فصل جديد</h2>
        <form action={createClassFileAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="academicYear" value={academicYear} />
          <input type="hidden" name="term" value={term} />
          <div>
            <label className="block text-xs font-bold mb-1.5 text-[var(--color-muted)]">الصف</label>
            <select name="grade" required defaultValue=""
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
              <option value="" disabled>اختر الصف</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>{GRADE_LABELS[g]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-[var(--color-muted)]">الفصل</label>
            <select name="section" required defaultValue=""
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
              <option value="" disabled>رقم الفصل</option>
              {SECTION_OPTIONS.map((s) => (
                <option key={s} value={s}>فصل {s}</option>
              ))}
            </select>
          </div>
          <button type="submit"
            className="rounded-xl bg-[var(--color-primary)] text-white font-bold px-5 py-2 text-sm hover:bg-[var(--color-primary-light)] transition-colors">
            إنشاء الفصل
          </button>
        </form>
      </section>

      {files.length === 0 ? (
        <p className="text-center text-sm text-[var(--color-muted)] py-12">
          لم يتم إنشاء أى فصل بعد لهذا الترم.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((f) => (
            <Link key={f.id} href={`/teacher/${yearSlug}/${term}/${f.id}`}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-primary)] transition-colors">
              <p className="font-display font-bold text-[var(--color-primary-dark)]">
                {gradeSectionLabel(f.grade, f.section)}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {f._count.students} طالب
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
