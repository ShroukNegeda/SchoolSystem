"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTeacherAction } from "@/lib/actions/admin";
import { SUBJECT_OPTIONS, SUBJECT_LABELS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function TeacherForm({ academicYear }: { academicYear?: string }) {
  const [state, formAction, pending] = useActionState(createTeacherAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {academicYear && <input type="hidden" name="academicYear" value={academicYear} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--color-muted)]" htmlFor="name">
            الاسم بالكامل
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="مثال: أ. محمد علي"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--color-muted)]" htmlFor="phone">
            رقم الهاتف
          </label>
          <input
            id="phone"
            name="phone"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm tabular focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--color-muted)]" htmlFor="email">
            البريد الإلكتروني (لتسجيل الدخول)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="teacher@example.com"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--color-muted)]" htmlFor="password">
            كلمة المرور المؤقتة
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="6 خانات أو أكثر"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1.5 text-[var(--color-muted)]" htmlFor="subject">
          المادة الدراسية
        </label>
        <select
          id="subject"
          name="subject"
          required
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          defaultValue=""
        >
          <option value="" disabled>
            اختر المادة المسندة للمدرس
          </option>
          {SUBJECT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {SUBJECT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <div className="rounded-xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-xs font-bold px-4 py-2.5">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl bg-[var(--color-success-bg)] text-[var(--color-success)] text-xs font-bold px-4 py-2.5">
          تم إضافة المدرس بنجاح في قاعدة البيانات.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto rounded-xl bg-[var(--color-primary)] text-white font-bold px-6 py-2.5 text-sm hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-60"
      >
        {pending ? "جاري الإضافة..." : "حفظ المدرس"}
      </button>
    </form>
  );
}
