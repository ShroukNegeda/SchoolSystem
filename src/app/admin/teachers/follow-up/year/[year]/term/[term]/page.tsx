import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";
import AdminTeacherEvaluation from "@/components/AdminTeacherEvaluation";
import {
  academicYearFromParam,
  TERM_OPTIONS,
  TERM_LABELS,
  WEEKS_IN_TERM,
} from "@/lib/constants";
import {
  assignTeacherToYearAction,
  createTeacherSimpleAction,
  removeTeacherFromYearAction,
} from "@/lib/actions/admin";
import { SUBJECT_LABELS } from "@/lib/constants";
import type { Term } from "@prisma/client";

export default async function AdminTeacherFollowUpTermPage({
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
    where: {
      role: "TEACHER",
      teacherYearFiles: { some: { academicYear } },
    },
    include: {
      evaluations: { where: { academicYear, term } },
    },
    orderBy: { name: "asc" },
  });

  const allTeachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { name: "asc" },
  });

  const unassignedTeachers = allTeachers.filter(
    (t) => !teachers.some((a) => a.id === t.id)
  );

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <div className="mb-4">
        <Link href={`/admin/teachers/follow-up/year/${yearParam}`} className="text-sm text-[var(--color-muted)] hover:underline">
          ← الرجوع
        </Link>
      </div>

      <div className="mb-5">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--color-primary-dark)]">
          متابعة المدرسين - {TERM_LABELS[term]} ({academicYear})
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">تقييم أداء المدرسين أسبوعياً</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* الجانب الأيسر - إدارة المدرسين */}
        <div className="space-y-6">
          {unassignedTeachers.length > 0 && (
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-sm text-[var(--color-primary-dark)] mb-4">إضافة مدرس موجود</h2>
              <form action={assignTeacherToYearAction} className="space-y-3">
                <input type="hidden" name="academicYear" value={academicYear} />
                <select name="teacherId" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs bg-white">
                  <option value="">اختر المدرس</option>
                  {unassignedTeachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button className="w-full rounded-xl bg-[var(--color-primary)] text-white py-2.5 text-xs font-bold hover:opacity-90 transition-all">
                  إضافة
                </button>
              </form>
            </section>
          )}

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold text-sm text-[var(--color-primary-dark)] mb-4">إضافة مدرس جديد</h2>
            <form action={createTeacherSimpleAction} className="space-y-3">
              <input type="hidden" name="academicYear" value={academicYear} />
              <input name="name" placeholder="اسم المدرس" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs" required />
              <select name="subject" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs bg-white" required>
                <option value="">اختر المادة</option>
                {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button className="w-full rounded-xl bg-[var(--color-primary)] text-white py-2.5 text-xs font-bold hover:opacity-90 transition-all">
                إضافة مدرس
              </button>
            </form>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-[var(--color-primary-dark)]">المدرسين</h2>
              <span className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] px-2.5 py-1 rounded-full font-bold">
                {teachers.length}
              </span>
            </div>
            {teachers.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] text-center py-6">لا يوجد مدرسين</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {teachers.map((t) => (
                  <div key={t.id} className="group flex justify-between items-center text-xs p-3 border border-gray-100 rounded-xl hover:border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/5 transition-all">
                    <div>
                      <span className="font-bold text-gray-800 block">{t.name}</span>
                      {t.subject && <span className="text-[10px] text-[var(--color-muted)]">{SUBJECT_LABELS[t.subject]}</span>}
                    </div>
                    <form action={removeTeacherFromYearAction}>
                      <input type="hidden" name="teacherId" value={t.id} />
                      <input type="hidden" name="academicYear" value={academicYear} />
                      <button className="text-red-400 hover:text-red-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">✕</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* الجانب الأيمن - جدول التقييم */}
        <div className="lg:col-span-2">
          {teachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[var(--color-muted)]">
              أضف مدرسين أولاً لبدء التقييم
            </div>
          ) : (
            <section className="rounded-2xl border bg-white overflow-hidden">
              <AdminTeacherEvaluation
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
