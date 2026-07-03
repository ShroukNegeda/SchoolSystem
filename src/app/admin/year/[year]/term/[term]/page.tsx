import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import { academicYearFromParam, TERM_OPTIONS, TERM_LABELS, GRADE_OPTIONS, GRADE_LABELS, SECTION_OPTIONS } from "@/lib/constants";
import AdminTeacherAttendance from "@/components/AdminTeacherAttendance";
import type { Term } from "@prisma/client";

export default async function AdminYearTermPage({ params }: { params: Promise<{ year: string; term: string }> }) {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  const { year, term: termParam } = await params;
  const academicYear = academicYearFromParam(year);
  const term = termParam as Term;
  if (!academicYear || !TERM_OPTIONS.includes(term)) notFound();

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: { attendanceLogs: { where: { academicYear, term } } },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link href="/admin" className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع لاختيار السنة
      </Link>
      <Link href={`/admin/year/${year}`} className="text-sm text-[var(--color-muted)] hover:underline block mt-2">
        ← الرجوع للسنة {academicYear}
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">{academicYear} — {TERM_LABELS[term]}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">تسجيل حضور المدرسين لهذا الترم.</p>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
        <AdminTeacherAttendance teachers={teachers} week={1} academicYear={academicYear} term={term} />
      </section>
    </DashboardShell>
  );
}
