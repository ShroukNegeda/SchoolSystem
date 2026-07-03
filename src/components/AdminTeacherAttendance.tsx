"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveTeacherAttendanceAction } from "@/lib/actions/admin";
import { SUBJECT_LABELS, WEEKS_IN_TERM } from "@/lib/constants";
import type { AttendanceStatus, SubjectName, Term } from "@prisma/client";

type TeacherWithAttendance = {
  id: string;
  name: string;
  subject: SubjectName | null;
  attendanceLogs: { weekNumber: number; status: AttendanceStatus }[];
};

const STATUS_CONFIG: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "PRESENT",           label: "حاضر",       active: "bg-[var(--color-success)] text-white" },
  { value: "EXCUSED_ABSENCE",   label: "غائب بعذر",  active: "bg-[var(--color-accent)] text-white" },
  { value: "UNEXCUSED_ABSENCE", label: "بدون عذر",   active: "bg-[var(--color-danger)] text-white" },
];

export default function AdminTeacherAttendance({
  teachers,
  week,
  academicYear,
  term,
}: {
  teachers: TeacherWithAttendance[];
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

  async function submitAttendance(teacherId: string, status: AttendanceStatus) {
    const fd = new FormData();
    fd.set("teacherId", teacherId);
    fd.set("weekNumber", week.toString());
    fd.set("status", status);
    fd.set("academicYear", academicYear);
    fd.set("term", term);
    startTransition(async () => { await saveTeacherAttendanceAction(fd); });
  }

  return (
    <div className="space-y-5">
      {/* اختيار الأسبوع */}
      <div className="px-4 pt-4">
        <p className="text-xs font-bold mb-2 text-[var(--color-muted)]">اختر الأسبوع الدراسي</p>
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

      {/* Cards على الموبايل */}
      <div className="flex flex-col gap-3 sm:hidden px-4 pb-4">
        {teachers.map((teacher) => {
          const currentStatus = teacher.attendanceLogs.find((l) => l.weekNumber === week)?.status ?? null;
          return (
            <div key={teacher.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <div className="mb-3">
                <p className="font-bold text-sm text-[var(--color-ink)]">{teacher.name}</p>
                {teacher.subject && (
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{SUBJECT_LABELS[teacher.subject]}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_CONFIG.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={isPending}
                    onClick={() => submitAttendance(teacher.id, s.value)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      currentStatus === s.value
                        ? s.active + " border-transparent"
                        : "bg-[var(--color-bg)] text-[var(--color-muted)] border-[var(--color-border)]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* جدول على الشاشات الكبيرة */}
      <div className="hidden sm:block rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-muted)]">
              <th className="text-right px-4 py-3 font-bold">المدرس</th>
              <th className="text-right px-3 py-3 font-bold">المادة</th>
              <th className="text-center px-3 py-3 font-bold">الحضور — أسبوع {week}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {teachers.map((teacher) => {
              const currentStatus = teacher.attendanceLogs.find((l) => l.weekNumber === week)?.status ?? null;
              return (
                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-[var(--color-ink)]">{teacher.name}</td>
                  <td className="px-3 py-3 text-xs text-[var(--color-muted)]">
                    {teacher.subject ? SUBJECT_LABELS[teacher.subject] : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex rounded-xl bg-[var(--color-bg)] p-1 gap-1">
                      {STATUS_CONFIG.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          disabled={isPending}
                          onClick={() => submitAttendance(teacher.id, s.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === s.value
                              ? s.active
                              : "text-[var(--color-muted)] hover:bg-white"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
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
