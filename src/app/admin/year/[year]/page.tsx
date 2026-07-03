import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { academicYearFromParam, getCurrentAcademicYear, TERM_OPTIONS, TERM_LABELS } from "@/lib/constants";

export default async function AdminYearPage({ params }: { params: Promise<{ year: string }> }) {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  const { year } = await params;
  const academicYear = academicYearFromParam(year);
  if (!academicYear) notFound();

  const currentYear = getCurrentAcademicYear();

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link href="/admin" className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لاختيار السنة
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">السنة الدراسية {academicYear}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          اختر الترم لمتابعة حضور المدرسين بنفس السنة.
        </p>
        {academicYear === currentYear && <p className="text-xs text-[var(--color-primary-dark)] mt-2">السنة الحالية</p>}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 mb-8">
        {TERM_OPTIONS.map((term) => (
          <Link
            key={term}
            href={`/admin/year/${year}/term/${term}`}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-right hover:border-[var(--color-primary)] transition-colors"
          >
            <p className="font-display text-xl font-bold text-[var(--color-primary-dark)]">{TERM_LABELS[term]}</p>
          </Link>
        ))}
      </section>
    </DashboardShell>
  );
}
