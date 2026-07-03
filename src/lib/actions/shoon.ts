"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AttendanceStatus, Term } from "@prisma/client";
import { yearToSlug, monthLabelForWeek } from "@/lib/constants";

function filePath(f: { academicYear: string; term: string; id: string }) {
  return `/shoon/${yearToSlug(f.academicYear)}/${f.term}/${f.id}`;
}
function termPath(academicYear: string, term: string) {
  return `/shoon/${yearToSlug(academicYear)}/${term}`;
}

async function findShoonFile(
  shoonId: string,
  grade: "G1" | "G2" | "G3",
  section: number,
  academicYear: string,
  term: Term,
) {
  return prisma.shoonClassFile.findUnique({
    where: {
      shoonId_grade_section_academicYear_term: {
        shoonId, grade, section, academicYear, term,
      },
    },
    include: { students: { orderBy: { order: "asc" } } },
  });
}

async function createShoonFileForTerm({
  shoonId,
  grade,
  section,
  academicYear,
  term,
  students,
}: {
  shoonId: string;
  grade: "G1" | "G2" | "G3";
  section: number;
  academicYear: string;
  term: Term;
  students: { name: string; order: number }[];
}) {
  return prisma.shoonClassFile.create({
    data: {
      shoonId,
      grade, section, academicYear, term,
      students: { create: students },
    },
    include: { students: { orderBy: { order: "asc" } } },
  });
}

async function isAnyMonthLocked(grade: string, section: number, academicYear: string, term: string) {
  const count = await prisma.monthLock.count({
    where: { grade: grade as any, section, academicYear, term: term as any },
  });
  return count > 0;
}

async function isMonthLocked(grade: string, section: number, academicYear: string, term: string, monthLabel: string) {
  const lock = await prisma.monthLock.findUnique({
    where: {
      grade_section_academicYear_term_monthLabel: {
        grade: grade as any, section, academicYear, term: term as any, monthLabel,
      },
    },
  });
  return !!lock;
}

export async function createShoonFileAction(formData: FormData) {
  const session = await requireRole("SHOON");

  const grade       = String(formData.get("grade")) as "G1" | "G2" | "G3";
  const section     = Number(formData.get("section"));
  const academicYear = String(formData.get("academicYear"));
  const term        = String(formData.get("term")) as Term;

  let term1File = await findShoonFile(session.userId, grade, section, academicYear, "TERM1");
  let term2File = await findShoonFile(session.userId, grade, section, academicYear, "TERM2");

  if (!term1File) {
    term1File = await createShoonFileForTerm({
      shoonId: session.userId,
      grade, section, academicYear, term: "TERM1", students: [],
    });
  }

  if (!term2File) {
    term2File = await createShoonFileForTerm({
      shoonId: session.userId,
      grade, section, academicYear, term: "TERM2",
      students: term1File.students.map((s) => ({ name: s.name, order: s.order })),
    });
  }

  revalidatePath(termPath(academicYear, "TERM1"));
  revalidatePath(termPath(academicYear, "TERM2"));
  redirect(filePath(term === "TERM1" ? term1File : term2File));
}

export async function addShoonStudentAction(formData: FormData) {
  const session = await requireRole("SHOON");
  const fileId = String(formData.get("fileId"));
  const name   = String(formData.get("name") || "").trim();
  if (!name) return;

  const file = await prisma.shoonClassFile.findFirst({
    where: { id: fileId, shoonId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  if (await isAnyMonthLocked(file.grade, file.section, file.academicYear, file.term)) {
    throw new Error("لا يمكن إضافة طالب بعد قفل أى شهر من الإدارة");
  }

  const count = await prisma.shoonStudent.count({ where: { shoonClassFileId: fileId } });
  await prisma.shoonStudent.create({ data: { shoonClassFileId: fileId, name, order: count } });

  if (file.term === "TERM1") {
    const term2File = await prisma.shoonClassFile.findUnique({
      where: {
        shoonId_grade_section_academicYear_term: {
          shoonId: session.userId,
          grade: file.grade, section: file.section,
          academicYear: file.academicYear, term: "TERM2",
        },
      },
    });
    if (term2File) {
      await prisma.shoonStudent.create({
        data: { shoonClassFileId: term2File.id, name, order: count },
      });
      revalidatePath(filePath(term2File));
    }
  }

  revalidatePath(filePath(file));
}

export async function deleteShoonStudentAction(formData: FormData) {
  const session = await requireRole("SHOON");
  const studentId = String(formData.get("studentId"));
  const fileId    = String(formData.get("fileId"));
  const weekNumber = Number(formData.get("weekNumber"));

  const file = await prisma.shoonClassFile.findFirst({
    where: { id: fileId, shoonId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  const monthLabel = monthLabelForWeek(weekNumber);
  if (await isMonthLocked(file.grade, file.section, file.academicYear, file.term, monthLabel)) {
    throw new Error("لا يمكن حذف طالب من شهر مقفول");
  }

  const student = await prisma.shoonStudent.findFirst({
    where: { id: studentId, shoonClassFileId: fileId },
  });
  if (!student) return;

  await prisma.shoonStudent.delete({ where: { id: studentId } });

  if (file.term === "TERM1") {
    const term2File = await prisma.shoonClassFile.findUnique({
      where: {
        shoonId_grade_section_academicYear_term: {
          shoonId: session.userId,
          grade: file.grade, section: file.section,
          academicYear: file.academicYear, term: "TERM2",
        },
      },
    });
    if (term2File) {
      await prisma.shoonStudent.deleteMany({
        where: { shoonClassFileId: term2File.id, name: student.name, order: student.order },
      });
      revalidatePath(filePath(term2File));
    }
  }

  revalidatePath(filePath(file));
}

export async function saveAttendanceAction(formData: FormData) {
  const session    = await requireRole("SHOON");
  const studentId  = String(formData.get("studentId"));
  const fileId     = String(formData.get("fileId"));
  const weekNumber = Number(formData.get("weekNumber"));
  const status     = String(formData.get("status")) as AttendanceStatus;

  const file = await prisma.shoonClassFile.findFirst({
    where: { id: fileId, shoonId: session.userId },
  });
  if (!file) throw new Error("غير مصرح لك");

  const monthLabel = monthLabelForWeek(weekNumber);
  if (await isMonthLocked(file.grade, file.section, file.academicYear, file.term, monthLabel)) {
    throw new Error("هذا الشهر مقفول من الإدارة ولا يمكن تعديل الحضور");
  }

  await prisma.attendanceRecord.upsert({
    where: { shoonStudentId_weekNumber: { shoonStudentId: studentId, weekNumber } },
    create: { shoonStudentId: studentId, weekNumber, status },
    update: { status },
  });
  revalidatePath(filePath(file));
}
