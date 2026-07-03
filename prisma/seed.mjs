import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "Ayman@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "Ayman123";
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    console.log("حساب المدير موجود بالفعل:", normalizedEmail);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: "مدير المدرسة",
      phone: "00000000000",
      email: normalizedEmail,
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log("تم إنشاء حساب المدير بنجاح:");
  console.log("البريد الإلكترونى:", normalizedEmail);
  console.log("كلمة المرور:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
