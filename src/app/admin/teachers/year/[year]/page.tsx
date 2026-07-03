import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { academicYearFromParam, TERM_OPTIONS, TERM_LABELS } from "@/lib/constants";

export default async function AdminTeachersTermSelectPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) redirect("/login");

  const { year: yearParam } = await params;
  const academicYear = academicYearFromParam(yearParam);
  if (!academicYear) notFound();

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link href="/admin/teachers" className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لاختيار السنة الدراسية
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          حضور المدرسين - السنة الدراسية {academicYear}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          اختر الفصل الدراسي (الترم) لعرض وتسجيل حضور وغياب المدرسين.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
        {TERM_OPTIONS.map((term) => (
          <Link
            key={term}
            href={`/admin/teachers/year/${yearParam}/term/${term}`}
            className="group rounded-3xl border border-[var(--color-border)] bg-white p-8 text-center transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-xs"
          >
            <span className="block font-display text-xl font-bold text-[var(--color-primary-dark)] mb-2">
              {TERM_LABELS[term]}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              تسجيل ومراجعة حضور المدرسين لأسابيع {TERM_LABELS[term]}.
            </span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
