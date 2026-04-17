require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// [2026-04-17] 초기 시드 데이터 - 관리자 계정 생성
async function main() {
  const hash = await bcrypt.hash('admin1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@panocean.com' },
    update: {},
    create: {
      email: 'admin@panocean.com',
      password: hash,
      name: '안전경영팀',
      role: 'ADMIN',
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  console.log('✓ Admin:', admin.email);
  console.log('  비밀번호: admin1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
