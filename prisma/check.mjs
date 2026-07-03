import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users count:", users.length);
  for (const u of users) {
    console.log(`  - ${u.email} (${u.role})`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());