"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { SUBJECT_OPTIONS, SUBJECT_LABELS } from "@/lib/constants";

const initialState: ActionState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [role, setRole] = useState<"TEACHER" | "SHOON">("TEACHER");

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-bold mb-1.5" htmlFor="name">
          الاسم بالكامل
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm"
          placeholder="مثال: أحمد محمود"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1.5" htmlFor="phone">
            رقم الهاتف
          </label>
          <input
            id="phone"
            name="phone"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm tabular"
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>
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
          minLength={6}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm"
          placeholder="6 خانات على الأقل"
          dir="ltr"
        />
      </div>

      <div>
        <span className="block text-sm font-bold mb-1.5">الوظيفة</span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("TEACHER")}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
              role === "TEACHER"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary-dark)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            مدرس مادة
          </button>
          <button
            type="button"
            onClick={() => setRole("SHOON")}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
              role === "SHOON"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary-dark)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            شؤون الطلبة
          </button>
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

      {role === "TEACHER" && (
        <div>
          <label className="block text-sm font-bold mb-1.5" htmlFor="subject">
            المادة التى تدرسها
          </label>
          <select
            id="subject"
            name="subject"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              اختر المادة
            </option>
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

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
        {pending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
      </button>

      <p className="text-center text-sm text-[var(--color-muted)]">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="text-[var(--color-primary)] font-bold">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
