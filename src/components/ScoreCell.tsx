"use client";

import { useRef, useTransition } from "react";

export default function ScoreCell({
  action,
  hidden,
  name,
  defaultValue,
  max,
}: {
  action: (formData: FormData) => Promise<void> | void;
  hidden: Record<string, string | number>;
  name: string;
  defaultValue: number;
  max: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(fd) => startTransition(() => action(fd))}
      className="inline-block"
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        type="number"
        name={name}
        min={0}
        max={max}
        step={0.5}
        defaultValue={defaultValue}
        onBlur={() => formRef.current?.requestSubmit()}
        className={`w-16 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-sm text-center tabular focus:border-[var(--color-primary)] ${
          pending ? "opacity-50" : ""
        }`}
      />
    </form>
  );
}
