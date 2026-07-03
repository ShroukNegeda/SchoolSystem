import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import TeacherYearCreateForm from "@/components/TeacherYearCreateForm";
import {
  SUBJECT_LABELS,
  availableYears,
  currentAcademicYear,
  yearToSlug,
} from "@/lib/constants";

export default async function TeacherHome() {
  const session = await requireRole("TEACHER");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  // السنوات التى يوجد فيها ملفات للمدرس ده
  const [yearFiles, classYears] = await Promise.all([
    prisma.teacherYearFile.findMany({
      where: { teacherId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.classFile.findMany({
      where: { teacherId: session.userId },
      select: { academicYear: true },
      distinct: ["academicYear"],
    }),
  ]);

  const visibleYears = Array.from(
    new Set([
      ...yearFiles.map((file) => file.academicYear),
      ...classYears.map((file) => file.academicYear),
    ]),
  );

  const years = availableYears();
  const current = currentAcademicYear();

  return (
    <DashboardShell name={user.name} role="TEACHER">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          اختر السنة الدراسية
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          مادة {user.subject ? SUBJECT_LABELS[user.subject] : "—"}
        </p>
      </div>

      <div className="max-w-md">
        <TeacherYearCreateForm years={years} defaultYear={current} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-[var(--color-primary-dark)]">
          ملفات السنوات
        </h2>

        {visibleYears.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-muted)]">
            لم يتم إنشاء أي سنة بعد.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleYears.map((year) => (
              <Link
                key={year}
                href={`/teacher/${yearToSlug(year)}`}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition-colors hover:border-[var(--color-primary)]"
              >
                <p className="font-display text-xl font-extrabold text-[var(--color-primary-dark)]">
                  السنة الدراسية
                </p>
                <p className="mt-2 text-lg font-bold text-[var(--color-text)]">{year}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
