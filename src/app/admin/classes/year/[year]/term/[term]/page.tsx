import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { GRADE_OPTIONS, GRADE_LABELS, SECTION_OPTIONS, gradeSectionLabel, academicYearFromParam, TERM_OPTIONS, TERM_LABELS } from "@/lib/constants";
import type { Term } from "@prisma/client";

export default async function AdminClassesTermPage({
  params,
}: {
  params: Promise<{ year: string; term: string }>;
}) {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const { year: yearParam, term: termParam } = await params;
  const academicYear = academicYearFromParam(yearParam);
  const term = termParam as Term;

  if (!academicYear || !TERM_OPTIONS.includes(term)) notFound();

  const [classFiles, shoonFiles] = await Promise.all([
    prisma.classFile.findMany({
      where: { academicYear, term },
      select: { grade: true, section: true },
    }),
    prisma.shoonClassFile.findMany({
      where: { academicYear, term },
      select: { grade: true, section: true },
    }),
  ]);

  const teacherCounts = new Map<string, number>();
  classFiles.forEach((f) => {
    const key = `${f.grade}-${f.section}`;
    teacherCounts.set(key, (teacherCounts.get(key) || 0) + 1);
  });
  const shoonKeys = new Set(shoonFiles.map((f) => `${f.grade}-${f.section}`));

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link href={`/admin/classes/year/${yearParam}`} className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لاختيار الترم ({academicYear})
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          فصول المدرسة - {TERM_LABELS[term]} ({academicYear})
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          استعرض الفصول والطلاب المسجلين بواسطة المدرسين وشؤون الطلاب في هذا الترم.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GRADE_OPTIONS.map((grade) => (
          <section key={grade} className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="font-display font-bold text-base mb-4 text-[var(--color-primary-dark)] border-b border-gray-100 pb-2">
                {GRADE_LABELS[grade]}
              </h2>
              <div className="grid gap-2">
                {SECTION_OPTIONS.map((section) => {
                  const key = `${grade}-${section}`;
                  const teacherCount = teacherCounts.get(key) || 0;
                  const hasShoon = shoonKeys.has(key);
                  return (
                    <Link
                      key={section}
                      href={`/admin/classes/year/${yearParam}/term/${term}/${grade}/${section}`}
                      className="rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3.5 text-right hover:border-[var(--color-primary)] hover:bg-white transition-all"
                    >
                      <p className="text-xs font-bold text-[var(--color-ink)]">{gradeSectionLabel(grade, section)}</p>
                      <p className="text-[10px] text-[var(--color-muted)] mt-1 font-medium">
                        {teacherCount} ملفات درجات · {hasShoon ? "يوجد كشف غياب" : "لا يوجد غياب"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
