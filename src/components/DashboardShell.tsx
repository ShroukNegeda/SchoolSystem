import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export default function DashboardShell({
  name,
  role,
  children,
}: {
  name: string;
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/Login.png" alt="لوجو المدرسة" className="w-9 h-9 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="font-display font-bold text-sm leading-tight text-[var(--color-primary-dark)] truncate max-w-[160px] sm:max-w-none">
                {name}
              </p>
              <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)]">
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>

          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-all cursor-pointer whitespace-nowrap"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-5 sm:py-8">{children}</main>
    </div>
  );
}
