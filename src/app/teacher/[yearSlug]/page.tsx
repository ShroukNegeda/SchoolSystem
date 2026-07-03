import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { slugToYear, TERM_LABELS, GRADE_LABELS, SUBJECT_LABELS } from "@/lib/constants";

export default async function TeacherYearPage({
  params,
}: {
  params: Promise<{ yearSlug: string }>;
}) {
  const session = await requireRole("TEACHER");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  const { yearSlug } = await params;
  const academicYear = slugToYear(yearSlug);

  // عدد الفصول فى كل ترم
  const [term1Count, term2Count] = await Promise.all([
    prisma.classFile.count({ where: { teacherId: session.userId, academicYear, term: "TERM1" } }),
    prisma.classFile.count({ where: { teacherId: session.userId, academicYear, term: "TERM2" } }),
  ]);

  const terms = [
    { key: "TERM1" as const, count: term1Count },
    { key: "TERM2" as const, count: term2Count },
  ];

  return (
    <DashboardShell name={user.name} role="TEACHER">
      <Link href="/teacher" className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لاختيار السنة
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          السنة الدراسية {academicYear}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          مادة {user.subject ? SUBJECT_LABELS[user.subject] : "—"} — اختر الترم
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {terms.map(({ key, count }) => (
          <Link
            key={key}
            href={`/teacher/${yearSlug}/${key}`}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center hover:border-[var(--color-primary)] transition-colors"
          >
            <p className="font-display text-xl font-extrabold text-[var(--color-primary-dark)] mb-2">
              {TERM_LABELS[key]}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {count > 0 ? `${count} فصل مسجل` : "لا توجد فصول بعد"}
            </p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
