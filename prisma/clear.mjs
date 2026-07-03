import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
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
      const r = await prisma[m].deleteMany();
      writeFileSync("clear_log.txt", `OK ${m}: ${r.count}\n`, { flag: "a" });
    } catch (e) {
      writeFileSync("clear_log.txt", `ERR ${m}: ${e.message}\n`, { flag: "a" });
    }
  }

  const count = await prisma.user.count();
  writeFileSync("clear_log.txt", `Users after clear: ${count}\n`, { flag: "a" });
}

main()
  .catch((e) => {
    writeFileSync("clear_log.txt", `FATAL: ${e.message}\n`, { flag: "a" });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });