import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { availableYears, currentAcademicYear } from "@/lib/constants";
import YearSelect from "@/components/YearSelect";

export default async function AdminTeachersYearSelectPage() {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) redirect("/login");

  const years = availableYears();
  const current = currentAcademicYear();

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link href="/admin" className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع للرئيسية
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          حضور المدرسين - اختيار السنة الدراسية
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          اختر السنة الدراسية للمتابعة أو أنشئ سنة دراسية جديدة للبدء.
        </p>
      </div>

      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 max-w-xl mx-auto shadow-xs">
        <h2 className="font-display font-bold text-lg mb-4 text-[var(--color-primary-dark)]">
          اختر السنة الدراسية لتسجيل الحضور
        </h2>
        <YearSelect years={years} defaultYear={current} prefix="admin/teachers/year" buttonLabel="عرض الحضور" />
      </section>
    </DashboardShell>
  );
}
