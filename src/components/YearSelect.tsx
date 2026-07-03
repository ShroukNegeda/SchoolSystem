"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { yearToSlug } from "@/lib/constants";

type YearSelectProps = {
  years: string[];
  defaultYear: string;
  prefix: string;
  defaultTerm?: "TERM1" | "TERM2";
  buttonLabel?: string;
};

export default function YearSelect({ years, defaultYear, prefix, defaultTerm, buttonLabel = "عرض" }: YearSelectProps) {
  const [selectedYear, setSelectedYear] = useState(defaultYear || years[0] || "");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedYear) return;
    router.push(`/${prefix}/${yearToSlug(selectedYear)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3">
      <label className="w-full sm:w-auto">
        <span className="block text-sm font-semibold text-[var(--color-muted)] mb-2">اختر السنة الدراسية</span>
        <select
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition-colors focus:border-[var(--color-primary)] focus:outline-none"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-light)]"
      >
        {buttonLabel}
      </button>
    </form>
  );
}