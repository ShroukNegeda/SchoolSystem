"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveTeacherEvaluationAction } from "@/lib/actions/admin";
import { SUBJECT_LABELS, WEEKS_IN_TERM } from "@/lib/constants";
import type { SubjectName, Term } from "@prisma/client";

const FIELDS: { key: string; label: string; max: number }[] = [
  { key: "teachingMethod",       label: "طريقة الشرح",            max: 7 },
  { key: "curriculumDist",       label: "توزيع المنهج",            max: 6 },
  { key: "personalHygiene",      label: "النظافة الشخصية",         max: 6 },
  { key: "classManagement",      label: "إدارة الحصة",             max: 7 },
  { key: "distribution",         label: "التنوع والابتكار",         max: 7 },
  { key: "aids",                 label: "الوسائل المعنية",          max: 6 },
  { key: "accompanyingActivity", label: "النشاط المصاحب",          max: 6 },
  { key: "studentInteraction",   label: "تفاعل الطلاب",            max: 7 },
  { key: "classControl",         label: "السيطرة على الفصل",        max: 7 },
  { key: "individualDiff",       label: "الفروق الفردية للطلاب",    max: 7 },
  { key: "prepBook",             label: "دفتر التحضير",            max: 6 },
  { key: "gradesBook",           label: "دفتر الدرجات",            max: 7 },
  { key: "studentBook",          label: "كراسة الطالب",            max: 7 },
  { key: "evaluations",          label: "التقييمات",               max: 7 },
  { key: "weakStudents",         label: "الطلاب الضعاف",           max: 7 },
];

type EvalRecord = Record<string, number | string | null | undefined>;

type Teacher = {
  id: string;
  name: string;
  subject: SubjectName | null;
  evaluations: Array<{
    weekNumber: number;
    [key: string]: number | string | null | undefined;
  }>;
};

export default function AdminTeacherEvaluation({
  teachers,
  week,
  academicYear,
  term,
}: {
  teachers: Teacher[];
  week: number;
  academicYear: string;
  term: Term;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleWeekChange(w: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", w.toString());
    router.push(`?${params.toString()}`);
  }

  async function submitField(teacherId: string, field: string, value: number, currentEval: EvalRecord) {
    const fd = new FormData();
    fd.set("teacherId", teacherId);
    fd.set("weekNumber", week.toString());
    fd.set("academicYear", academicYear);
    fd.set("term", term);
    FIELDS.forEach(({ key }) => {
      fd.set(key, key === field ? value.toString() : (currentEval[key] ?? 0).toString());
    });
    startTransition(() => saveTeacherEvaluationAction(fd));
  }

  return (
    <div className="space-y-4">
      <div className="px-4 pt-4">
        <label className="block text-xs font-bold mb-2 text-[var(--color-muted)]">
          اختر الأسبوع الدراسي
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: WEEKS_IN_TERM }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => handleWeekChange(w)}
              className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                w === week
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="w-full text-xs" style={{ minWidth: "900px" }}>
          <thead>
            <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-muted)]">
              <th className="text-right px-3 py-3 font-bold sticky right-0 bg-[var(--color-bg)] z-10 shadow-[1px_0_0_0_var(--color-border)]">المدرس</th>
              {FIELDS.map((f) => (
                <th key={f.key} className="px-2 py-3 font-bold text-center whitespace-nowrap">
                  {f.label}<br />
                  <span className="text-[10px] font-normal">/{f.max}</span>
                </th>
              ))}
              <th className="px-2 py-3 font-bold text-center whitespace-nowrap">التقدير<br /><span className="text-[10px] font-normal">/100</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {teachers.map((teacher) => {
              const ev = teacher.evaluations.find((e) => e.weekNumber === week) ?? {} as EvalRecord;
              const total = FIELDS.reduce((sum, f) => sum + Number(ev[f.key] ?? 0), 0);
              return (
                <tr key={teacher.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-2 font-bold sticky right-0 bg-white z-10 whitespace-nowrap shadow-[1px_0_0_0_var(--color-border)]">
                    {teacher.name}
                    {teacher.subject && (
                      <span className="block text-[10px] font-normal text-[var(--color-muted)]">
                        {SUBJECT_LABELS[teacher.subject]}
                      </span>
                    )}
                  </td>
                  {FIELDS.map((f) => (
                    <td key={f.key} className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={f.max}
                        step={0.5}
                        disabled={isPending}
                        defaultValue={ev[f.key] ?? 0}
                        key={`${teacher.id}-${f.key}-${week}`}
                        onBlur={(e) =>
                          submitField(teacher.id, f.key, Number(e.target.value), ev)
                        }
                        className="w-10 rounded-lg border border-[var(--color-border)] px-1 py-1 text-center text-xs focus:border-[var(--color-primary)] disabled:opacity-50"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold tabular text-[var(--color-primary-dark)]">
                    {Math.round(total * 10) / 10}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
