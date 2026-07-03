import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { slugToYear, TERM_LABELS } from "@/lib/constants";

export default async function ShoonYearPage({ params }: { params: Promise<{ yearSlug: string }> }) {
  const session = await requireRole("SHOON");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  const { yearSlug } = await params;
  const academicYear = slugToYear(yearSlug);

  const [t1, t2] = await Promise.all([
    prisma.shoonClassFile.count({ where: { shoonId: session.userId, academicYear, term: "TERM1" } }),
    prisma.shoonClassFile.count({ where: { shoonId: session.userId, academicYear, term: "TERM2" } }),
  ]);

  return (
    <DashboardShell name={user.name} role="SHOON">
      <Link href="/shoon" className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لاختيار السنة
      </Link>
      <div className="mt-4 mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          السنة الدراسية {academicYear}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">كشوف الحضور والغياب — اختر الترم</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {([["TERM1", t1], ["TERM2", t2]] as const).map(([key, count]) => (
          <Link key={key} href={`/shoon/${yearSlug}/${key}`}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center hover:border-[var(--color-primary)] transition-colors">
            <p className="font-display text-xl font-extrabold text-[var(--color-primary-dark)] mb-2">
              {TERM_LABELS[key]}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {count > 0 ? `${count} كشف مسجل` : "لا توجد كشوف بعد"}
            </p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
