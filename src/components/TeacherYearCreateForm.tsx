"use client";

import { useState } from "react";
import { createTeacherYearAction } from "@/lib/actions/teacher";

type TeacherYearCreateFormProps = {
  years: string[];
  defaultYear: string;
};

export default function TeacherYearCreateForm({
  years,
  defaultYear,
}: TeacherYearCreateFormProps) {
  const [selectedYear, setSelectedYear] = useState(defaultYear || years[0] || "");

  return (
    <form action={createTeacherYearAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="w-full sm:w-auto">
        <span className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">
          اختر السنة الدراسية
        </span>
        <select
          name="academicYear"
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
        إنشاء السنة
      </button>
    </form>
  );
}
