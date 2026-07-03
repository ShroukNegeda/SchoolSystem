"use client";

import { useRef, useTransition } from "react";

export function AddStudentForm({
  action,
  hidden,
}: {
  action: (formData: FormData) => Promise<void> | void;
  hidden: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          await action(fd);
          formRef.current?.reset();
        })
      }
      className="flex gap-2"
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        name="name"
        required
        placeholder="اسم الطالب"
        className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold px-4 py-2 hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-60"
      >
        إضافة
      </button>
    </form>
  );
}

export function DeleteStudentButton({
  action,
  hidden,
}: {
  action: (formData: FormData) => Promise<void> | void;
  hidden: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => {
        if (confirm("هل أنت متأكد من حذف الطالب؟")) startTransition(() => action(fd));
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-bold text-[var(--color-danger)] hover:underline disabled:opacity-50"
      >
        حذف
      </button>
    </form>
  );
}
