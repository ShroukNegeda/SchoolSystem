import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();
const log = [];

async function main() {
  // 1. Clear all data
  const models = [
    "weeklyGrade", "monthlyExam", "termFinalExam", "activityScore",
    "student", "classFile", "teacherYearFile",
    "attendanceRecord", "shoonStudent", "shoonClassFile",
    "monthLock", "teacherAttendance", "teacherEvaluation",
    "academicTerm", "academicYear", "user",
  ];
  for (const m of models) {
    try {
      // @ts-ignore
      await prisma[m].deleteMany();
      log.push(`Cleared: ${m}`);
    } catch (e) {
      log.push(`Error clearing ${m}: ${e.message}`);
    }
  }

  // 2. Seed admin user
  const email = "ayman@gmail.com";
  const password = "Ayman123";
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: "مدير المدرسة",
      phone: "00000000000",
      email,
      password: hashed,
      role: "ADMIN",
    },
  });
  log.push(`Created admin: ${email}`);

  const count = await prisma.user.count();
  log.push(`Total users: ${count}`);

  writeFileSync("run_result.txt", log.join("\n"));
}

main()
  .catch((e) => {
    writeFileSync("run_result.txt", "FATAL: " + e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });