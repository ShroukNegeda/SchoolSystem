"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import { revalidatePath } from "next/cache";
import type { AttendanceStatus, Term, SubjectName, Grade } from "@prisma/client";

export async function lockMonthAction(formData: FormData) {
  await requireRole("ADMIN");
  const grade = String(formData.get("grade")) as Grade;
  const section = Number(formData.get("section"));
  const academicYear = String(formData.get("academicYear"));
  const term = String(formData.get("term")) as Term;
  const monthLabel = String(formData.get("monthLabel"));

  await prisma.monthLock.upsert({
    where: { grade_section_academicYear_term_monthLabel: { grade, section, academicYear, term, monthLabel } },
    create: { grade, section, academicYear, term, monthLabel },
    update: {},
  });

  revalidatePath(`/shoon`, "layout");
  revalidatePath(`/admin/classes`);
}

export async function unlockMonthAction(formData: FormData) {
  await requireRole("ADMIN");
  const grade = String(formData.get("grade")) as Grade;
  const section = Number(formData.get("section"));
  const academicYear = String(formData.get("academicYear"));
  const term = String(formData.get("term")) as Term;
  const monthLabel = String(formData.get("monthLabel"));

  await prisma.monthLock.deleteMany({
    where: { grade, section, academicYear, term, monthLabel },
  });

  revalidatePath(`/shoon`, "layout");
  revalidatePath(`/admin/classes`);
}

export async function createAcademicYearAction(formData: FormData) {
  await requireRole("ADMIN");
  const year = String(formData.get("year"));
  if (!year) return;

  const existing = await prisma.academicYear.findUnique({ where: { year } });
  if (!existing) {
    await prisma.academicYear.create({
      data: {
        year,
        terms: {
          create: [
            { term: "TERM1" },
            { term: "TERM2" },
          ],
        },
      },
    });
  }

  revalidatePath("/admin/teachers");
}

export async function saveTeacherAttendanceAction(formData: FormData) {
  await requireRole("ADMIN");
  const teacherId = String(formData.get("teacherId"));
  const weekNumber = Number(formData.get("weekNumber"));
  const status = String(formData.get("status")) as AttendanceStatus;
  const academicYear = String(formData.get("academicYear"));
  const term = String(formData.get("term")) as Term;

  await prisma.teacherAttendance.upsert({
    where: { teacherId_academicYear_term_weekNumber: { teacherId, academicYear, term, weekNumber } },
    create: { teacherId, academicYear, term, weekNumber, status },
    update: { status },
  });

  revalidatePath("/admin/teachers");
}

export async function createTeacherAction(_prev: any, formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const subject = String(formData.get("subject") || "") as SubjectName;
  const academicYear = formData.get("academicYear") ? String(formData.get("academicYear")) : undefined;

  if (!name || !phone || !email || !password || !subject) {
    return { error: "جميع الحقول مطلوبة" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "البريد الإلكترونى مستخدم بالفعل" };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      phone,
      email,
      password: hashed,
      role: "TEACHER",
      subject,
      ...(academicYear ? {
        teacherYearFiles: {
          create: { academicYear }
        }
      } : {})
    },
  });

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/teachers/follow-up");
}

export async function createTeacherSimpleAction(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "") as SubjectName;
  const academicYear = formData.get("academicYear") ? String(formData.get("academicYear")) : undefined;

  if (!name || !subject) return;

  const timestamp = Date.now();
  const phone = `000${timestamp}`.slice(0, 11);
  const email = `teacher_${timestamp}@madrasa.local`;
  const password = process.env.DEFAULT_TEACHER_PASSWORD ?? crypto.randomUUID().slice(0, 12);

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      phone,
      email,
      password: hashed,
      role: "TEACHER",
      subject,
      ...(academicYear ? {
        teacherYearFiles: {
          create: { academicYear }
        }
      } : {})
    },
  });

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/teachers/follow-up");
}

export async function assignTeacherToYearAction(formData: FormData) {
  await requireRole("ADMIN");
  const teacherId = String(formData.get("teacherId"));
  const academicYear = String(formData.get("academicYear"));

  if (!teacherId || !academicYear) return;

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { id: true },
  });

  if (!teacher) return;

  const existing = await prisma.teacherYearFile.findUnique({
    where: { teacherId_academicYear: { teacherId, academicYear } },
  });

  if (!existing) {
    await prisma.teacherYearFile.create({
      data: { teacherId, academicYear },
    });
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/teachers/follow-up");
}

export async function saveTeacherEvaluationAction(formData: FormData) {
  await requireRole("ADMIN");
  const teacherId    = String(formData.get("teacherId"));
  const weekNumber   = Number(formData.get("weekNumber"));
  const academicYear = String(formData.get("academicYear"));
  const term         = String(formData.get("term")) as Term;

  const clamp = (field: string, max: number) =>
    Math.max(0, Math.min(max, Number(formData.get(field)) || 0));

  const data = {
    teachingMethod:       clamp("teachingMethod",       7),
    curriculumDist:       clamp("curriculumDist",       6),
    personalHygiene:      clamp("personalHygiene",      6),
    classManagement:      clamp("classManagement",      7),
    distribution:         clamp("distribution",         7),
    aids:                 clamp("aids",                 6),
    accompanyingActivity: clamp("accompanyingActivity", 6),
    studentInteraction:   clamp("studentInteraction",   7),
    classControl:         clamp("classControl",         7),
    individualDiff:       clamp("individualDiff",       7),
    prepBook:             clamp("prepBook",             6),
    gradesBook:           clamp("gradesBook",           7),
    studentBook:          clamp("studentBook",          7),
    evaluations:          clamp("evaluations",          7),
    weakStudents:         clamp("weakStudents",         7),
  };

  await prisma.teacherEvaluation.upsert({
    where: { teacherId_academicYear_term_weekNumber: { teacherId, academicYear, term, weekNumber } },
    create: { teacherId, academicYear, term, weekNumber, ...data },
    update: data,
  });

  revalidatePath("/admin/teachers/follow-up");
}

export async function removeTeacherFromYearAction(formData: FormData) {
  await requireRole("ADMIN");
  const teacherId = String(formData.get("teacherId"));
  const academicYear = String(formData.get("academicYear"));

  if (!teacherId || !academicYear) return;

  await prisma.teacherYearFile.deleteMany({
    where: { teacherId, academicYear },
  });

  await prisma.teacherAttendance.deleteMany({
    where: { teacherId, academicYear },
  });

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/teachers/follow-up");
}
