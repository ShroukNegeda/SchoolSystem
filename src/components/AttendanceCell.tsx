"use client";

import { useRef, useTransition } from "react";
import { ATTENDANCE_LABELS } from "@/lib/constants";

const STATUSES = ["PRESENT", "EXCUSED_ABSENCE", "UNEXCUSED_ABSENCE"] as const;

export default function AttendanceCell({
  action,
  hidden,
  defaultValue,
  disabled,
}: {
  action: (formData: FormData) => Promise<void> | void;
  hidden: Record<string, string>;
  defaultValue: string;
  disabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(value: string) {
    // نكون FormData يدويًا ونضبط القيمة الجديدة من parameter مش من DOM
    // ده بيضمن إن القيمة الصحيحة هي اللي تتبعت للسيرفر
    const fd = new FormData(formRef.current!);
    fd.set("status", value);
    startTransition(() => action(fd));
  }

  return (
    <form ref={formRef}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <select
        name="status"
        key={defaultValue}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        className={`rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-bold text-center disabled:opacity-50 ${
          pending ? "opacity-50" : ""
        } ${
          defaultValue === "PRESENT"
            ? "text-[var(--color-success)]"
            : "text-[var(--color-danger)]"
        }`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {ATTENDANCE_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
