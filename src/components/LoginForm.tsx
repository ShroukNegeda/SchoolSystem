"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-bold mb-1.5" htmlFor="email">
          البريد الإلكترونى
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm"
          placeholder="name@example.com"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1.5" htmlFor="password">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm"
          placeholder="••••••••"
          dir="ltr"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-sm px-4 py-2.5">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--color-primary)] text-white font-bold py-3 hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-60"
      >
        {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
      </button>

      <p className="text-center text-sm text-[var(--color-muted)]">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-[var(--color-primary)] font-bold">
          إنشاء حساب جديد
        </Link>
      </p>
    </form>
  );
}
