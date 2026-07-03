"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ExamMonth, Term } from "@prisma/client";
import { yearToSlug } from "@/lib/constants";

// مسار صفحة الفصل بناءً على بيانات الملف
function filePath(f: { academicYear: string; term: string; id: string }) {
  return `/teacher/${yearToSlug(f.academicYear)}/${f.term}/${f.id}`;
}
function termPath(academicYear: string, term: string) {
  return `/teacher/${yearToSlug(academicYear)}/${term}`;
}

export async function createTeacherYearAction(formData: FormData) {
  const session = await requireRole("TEACHER");
  const academicYear = String(formData.get("academicYear") || "").trim();
  if (!academicYear) redirect("/teacher");

  await prisma.teacherYearFile.upsert({
    where: {
      teacherId_academicYear: {
        teacherId: session.userId,
        academicYear,
      },
    },
    create: {
      teacherId: session.userId,
      academicYear,
    },
    update: {},
  });

  revalidatePath("/teacher");
  redirect("/teacher");
}

// ── إنشاء ملف فصل جديد ──
// إذا كان الترم = TERM2 يتم نقل أسماء الطلاب تلقائيًا من TERM1
export async function createClassFileAction(formData: FormData) {
  const session = await requireRole("TEACHER");

  const grade = String(formData.get("grade")) as "G1" | "G2" | "G3";
  const section = Number(formData.get("section"));
  const academicYear = String(formData.get("academicYear"));
  const term = String(formData.get("term")) as Term;

  const teacher = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!teacher?.subject) throw new Error("لا يوجد مادة مرتبطة بهذا الحساب");

  // هل الملف موجود بالفعل؟
  const existing = await prisma.classFile.findUnique({
    where: {
      teacherId_grade_section_academicYear_term: {
        teacherId: session.userId, grade, section, academicYear, term,
      },
    },
  });
  if (existing) {
    redirect(filePath(existing));
  }

  let term1File = await prisma.classFile.findUnique({
  where: {
    teacherId_grade_section_academicYear_term: {
      teacherId: session.userId,
      grade,
      section,
      academicYear,
      term: "TERM1",
    },
  },
  include: {
    students: {
      orderBy: { order: "asc" },
    },
  },
});

let term2File = await prisma.classFile.findUnique({
  where: {
    teacherId_grade_section_academicYear_term: {
      teacherId: session.userId,
      grade,
      section,
      academicYear,
      term: "TERM2",
    },
  },
  include: {
    students: {
      orderBy: { order: "asc" },
    },
  },
});

  // إذا كان ترم ثانٍ → نبحث عن الطلاب من الترم الأول
if (!term1File) {
  term1File = await prisma.classFile.create({
    data: {
      teacherId: session.userId,
      grade,
      section,
      subject: teacher.subject,
      academicYear,
      term: "TERM1",
    },
    include: {
      students: {
        orderBy: { order: "asc" },
      },
    },
  });
}

if (!term2File) {
  term2File = await prisma.classFile.create({
    data: {
      teacherId: session.userId,
      grade,
      section,
      subject: teacher.subject,
      academicYear,
      term: "TERM2",
      students: {
        create: term1File.students.map((s) => ({
          name: s.name,
          order: s.order,
        })),
      },
    },
    include: {
      students: {
        orderBy: { order: "asc" },
      },
    },
  });
}

  revalidatePath(termPath(academicYear, "TERM1"));
  revalidatePath(termPath(academicYear, "TERM2"));
  redirect(filePath(term === "TERM1" ? term1File : term2File));
}

// ── إدارة الطلاب ──
export async function addStudentAction(formData: FormData) {
  const session = await requireRole("TEACHER");
  const classFileId = String(formData.get("classFileId"));
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const file = await prisma.classFile.findFirst({
    where: { id: classFileId, teacherId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  const count = await prisma.student.count({ where: { classFileId } });
  await prisma.student.create({ data: { classFileId, name, order: count } });

  if (file.term === "TERM1") {
    const term2File = await prisma.classFile.findUnique({
      where: {
        teacherId_grade_section_academicYear_term: {
          teacherId: session.userId,
          grade: file.grade,
          section: file.section,
          academicYear: file.academicYear,
          term: "TERM2",
        },
      },
    });

    if (term2File) {
      await prisma.student.create({
        data: { classFileId: term2File.id, name, order: count },
      });
      revalidatePath(filePath(term2File));
    }
  }

  revalidatePath(filePath(file));
}

export async function deleteStudentAction(formData: FormData) {
  const session = await requireRole("TEACHER");
  const studentId = String(formData.get("studentId"));
  const classFileId = String(formData.get("classFileId"));

  const file = await prisma.classFile.findFirst({
    where: { id: classFileId, teacherId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  const student = await prisma.student.findFirst({
    where: { id: studentId, classFileId },
  });
  if (!student) return;

  await prisma.student.delete({ where: { id: studentId } });

  if (file.term === "TERM1") {
    const term2File = await prisma.classFile.findUnique({
      where: {
        teacherId_grade_section_academicYear_term: {
          teacherId: session.userId,
          grade: file.grade,
          section: file.section,
          academicYear: file.academicYear,
          term: "TERM2",
        },
      },
    });

    if (term2File) {
      await prisma.student.deleteMany({
        where: {
          classFileId: term2File.id,
          name: student.name,
          order: student.order,
        },
      });
      revalidatePath(filePath(term2File));
    }
  }

  revalidatePath(filePath(file));
}

// ── تسجيل الدرجات ──
export async function saveWeeklyGradeAction(formData: FormData) {
  const session = await requireRole("TEACHER");
  const studentId = String(formData.get("studentId"));
  const classFileId = String(formData.get("classFileId"));
  const weekNumber = Number(formData.get("weekNumber"));

  const file = await prisma.classFile.findFirst({
    where: { id: classFileId, teacherId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, isNaN(v) ? 0 : v));
  const notebook   = clamp(Number(formData.get("notebook")),   10);
  const evaluation = clamp(Number(formData.get("evaluation")), 20);
  const discipline = clamp(Number(formData.get("discipline")), 10);
  const homework   = clamp(Number(formData.get("homework")),   10);

  await prisma.weeklyGrade.upsert({
    where: { studentId_weekNumber: { studentId, weekNumber } },
    create: { studentId, weekNumber, notebook, evaluation, discipline, homework },
    update: { notebook, evaluation, discipline, homework },
  });
  revalidatePath(filePath(file));
}

export async function saveMonthlyExamAction(formData: FormData) {
  const session = await requireRole("TEACHER");
  const studentId   = String(formData.get("studentId"));
  const classFileId = String(formData.get("classFileId"));
  const month       = String(formData.get("month")) as ExamMonth;
  const score       = Math.max(0, Math.min(15, Number(formData.get("score")) || 0));

  const file = await prisma.classFile.findFirst({
    where: { id: classFileId, teacherId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  await prisma.monthlyExam.upsert({
    where: { studentId_month: { studentId, month } },
    create: { studentId, month, score },
    update: { score },
  });
  revalidatePath(filePath(file));
}

export async function saveTermFinalExamAction(formData: FormData) {
  const session = await requireRole("TEACHER");
  const studentId   = String(formData.get("studentId"));
  const classFileId = String(formData.get("classFileId"));
  const score       = Math.max(0, Math.min(30, Number(formData.get("score")) || 0));

  const file = await prisma.classFile.findFirst({
    where: { id: classFileId, teacherId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  await prisma.termFinalExam.upsert({
    where: { studentId },
    create: { studentId, score },
    update: { score },
  });
  revalidatePath(filePath(file));
}

export async function saveActivityScoreAction(formData: FormData) {
  const session = await requireRole("TEACHER");
  const studentId   = String(formData.get("studentId"));
  const classFileId = String(formData.get("classFileId"));
  const score       = Math.max(0, Math.min(100, Number(formData.get("score")) || 0));

  const file = await prisma.classFile.findFirst({
    where: { id: classFileId, teacherId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  await prisma.activityScore.upsert({
    where: { studentId },
    create: { studentId, score },
    update: { score },
  });
  revalidatePath(filePath(file));
}
