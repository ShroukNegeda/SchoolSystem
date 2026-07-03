const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findUnique({ where: { email: 'ayman@gmail.com' } });
  console.log('user found:', !!user, user?.role);
  if (user) {
    const ok = await bcrypt.compare('Ayman123', user.password);
    console.log('password ok:', ok);
  }
  await prisma.$disconnect();
})();
