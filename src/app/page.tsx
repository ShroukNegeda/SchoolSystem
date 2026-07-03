import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  icons: { icon: "/Login.png" },
};

export default async function Home() {
  const session = await getSession();
  if (session) {
    const home =
      session.role === "TEACHER" ? "/teacher" : session.role === "SHOON" ? "/shoon" : "/admin";
    redirect(home);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <img
            src="/Login.png"
            alt="شعار المدرسة"
            className="w-36 h-36 sm:w-52 sm:h-52 mx-auto object-contain"
          />
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--color-primary-dark)] mb-1 mt-2">
            إدارة غرب الزقازيق التعليمية
          </h1>
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--color-primary-dark)] mb-3">
            مدرسة أحمد الشاذلى عز الإعدادية المشتركة
          </h1>
          <p className="text-[var(--color-muted)] text-sm sm:text-base max-w-md mx-auto">
            منصة داخلية لتسجيل الدرجات ومتابعة الحضور والغياب، خاصة بالمدرسين وشؤون الطلبة والإدارة فقط.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <Link
            href="/login"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 text-center hover:border-[var(--color-primary)] transition-colors"
          >
            <span className="block font-display text-lg sm:text-xl font-bold text-[var(--color-primary-dark)] mb-1">
              تسجيل الدخول
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              إذا لديك حساب بالفعل كمدرس أو شؤون طلبة أو مدير
            </span>
          </Link>
          <Link
            href="/register"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 text-center hover:border-[var(--color-accent)] transition-colors"
          >
            <span className="block font-display text-lg sm:text-xl font-bold text-[var(--color-primary-dark)] mb-1">
              إنشاء حساب جديد
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              للمدرسين وشؤون الطلبة فقط
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
