import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import DashboardShell from "@/components/DashboardShell";

export default async function AdminHome() {
  const session = await requireRole("ADMIN");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) redirect("/login");

  return (
    <DashboardShell name={user.name} role="ADMIN">
      <div className="mb-10">
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
          لوحة تحكم المدير
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-2">
          اختر القسم المطلوب لمتابعة شؤون المدرسة
        </p>
      </div>

      {/* GRID Vertical Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">

        {/* حضور المدرسين */}
        <Link
          href="/admin/teachers"
          className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col items-center text-center gap-4 transition-all hover:border-[var(--color-primary)] hover:shadow-sm"
        >
          <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary-dark)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </svg>
          </div>

          <div>
            <p className="font-display font-bold text-[var(--color-primary-dark)] mb-1">
              حضور المدرسين
            </p>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              متابعة حضور وغياب المدرسين الأسبوعي حسب السنة والترم
            </p>
          </div>
        </Link>

        {/* متابعة المدرسين */}
        <Link
          href="/admin/teachers/follow-up"
          className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col items-center text-center gap-4 transition-all hover:border-[var(--color-primary)] hover:shadow-sm"
        >
          <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary-dark)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          </div>

          <div>
            <p className="font-display font-bold text-[var(--color-primary-dark)] mb-1">
              متابعة المدرسين
            </p>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              عرض المدرسين المسجلين وبياناتهم ومواد تدريسهم
            </p>
          </div>
        </Link>

        {/* فصول المدرسة */}
        <Link
          href="/admin/classes"
          className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col items-center text-center gap-4 transition-all hover:border-[var(--color-primary)] hover:shadow-sm"
        >
          <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary-dark)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <div>
            <p className="font-display font-bold text-[var(--color-primary-dark)] mb-1">
              فصول المدرسة
            </p>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              استعراض ملفات الدرجات وكشوف غياب الطلاب
            </p>
          </div>
        </Link>

      </div>
    </DashboardShell>
  );
}