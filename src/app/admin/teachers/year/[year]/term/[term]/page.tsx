import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import {
  academicYearFromParam,
  SUBJECT_LABELS,
  TERM_OPTIONS,
  TERM_LABELS,
  WEEKS_IN_TERM,
} from "@/lib/constants";
import AdminTeacherAttendance from "@/components/AdminTeacherAttendance";
import {
  assignTeacherToYearAction,
  createTeacherSimpleAction,
  removeTeacherFromYearAction,
} from "@/lib/actions/admin";
import type { Term } from "@prisma/client";

export default async function AdminTeachersTermPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string; term: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  const { year: yearParam, term: termParam } = await params;
  const academicYear = academicYearFromParam(yearParam);
  const term = termParam as Term;
  if (!academicYear || !TERM_OPTIONS.includes(term)) notFound();

  const sp = await searchParams;
  const week = Math.min(WEEKS_IN_TERM, Math.max(1, Number(sp.week) || 1));

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", teacherYearFiles: { some: { academicYear } } },
    include: { attendanceLogs: { where: { academicYear, term } } },
    orderBy: { name: "asc" },
  });

  const allTeachers = await prisma.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" } });
  const unassignedTeachers = allTeachers.filter((t) => !teachers.some((a) => a.id === t.id));

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <Link href={`/admin/teachers/year/${yearParam}`} className="text-sm text-[var(--color-muted)] hover:underline">
        ← الرجوع
      </Link>

      <div className="mt-3 mb-5">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--color-primary-dark)]">
          {TERM_LABELS[term]} — {academicYear}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">إدارة المدرسين وتسجيل الحضور</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">

        {/* الجانب الأيسر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">

          {/* إضافة مدرس جديد */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="font-bold text-sm text-[var(--color-primary-dark)] mb-3">إضافة مدرس جديد</h2>
            <form action={createTeacherSimpleAction} className="space-y-2.5">
              <input type="hidden" name="academicYear" value={academicYear} />
              <input
                name="name"
                placeholder="اسم المدرس"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
              <select
                name="subject"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">اختر المادة</option>
                {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button className="w-full rounded-xl bg-[var(--color-primary)] text-white py-2.5 text-sm font-bold hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer">
                إضافة مدرس
              </button>
            </form>
          </section>

          {/* إضافة مدرس موجود */}
          {unassignedTeachers.length > 0 && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h2 className="font-bold text-sm text-[var(--color-primary-dark)] mb-3">إضافة مدرس موجود</h2>
              <form action={assignTeacherToYearAction} className="space-y-2.5">
                <input type="hidden" name="academicYear" value={academicYear} />
                <select
                  name="teacherId"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">اختر المدرس</option>
                  {unassignedTeachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button className="w-full rounded-xl bg-[var(--color-primary)] text-white py-2.5 text-sm font-bold hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer">
                  إضافة
                </button>
              </form>
            </section>
          )}

          {/* قائمة المدرسين */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-[var(--color-primary-dark)]">المدرسون المسجلون</h2>
              <span className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] px-2.5 py-1 rounded-full font-bold">
                {teachers.length}
              </span>
            </div>
            {teachers.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] text-center py-6">لا يوجد مدرسون مسجلون</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {teachers.map((t) => (
                  <div key={t.id} className="group flex justify-between items-center p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-primary)]/5 transition-all">
                    <div>
                      <p className="font-bold text-sm text-[var(--color-ink)]">{t.name}</p>
                      {t.subject && (
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">{SUBJECT_LABELS[t.subject]}</p>
                      )}
                    </div>
                    <form action={removeTeacherFromYearAction}>
                      <input type="hidden" name="teacherId" value={t.id} />
                      <input type="hidden" name="academicYear" value={academicYear} />
                      <button className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* جدول الحضور */}
        <div className="lg:col-span-2">
          {teachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted)]">
              أضف مدرسين أولاً لبدء تسجيل الحضور
            </div>
          ) : (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
              <AdminTeacherAttendance
                teachers={teachers}
                week={week}
                academicYear={academicYear}
                term={term}
              />
            </section>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
