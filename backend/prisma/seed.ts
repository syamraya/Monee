import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Memulai Seeding...');

  // 1. Setup Data Admin
  const adminEmail = 'admin@monee.com';
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 2. Insert Admin ke Database
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword, // Update password jika email sudah ada
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: 'Super Admin Monee',
      password: hashedPassword,
      role: Role.ADMIN,
      balance: 0,
    },
  });

  console.log(`✅ Admin berhasil dibuat: ${admin.email}`);

  // 3. Tambahkan 1 Kategori Dasar (opsional, sebagai contoh awal)
  const defaultCategory = await prisma.category.upsert({
    where: { name: 'Umum' },
    update: {},
    create: {
      name: 'Umum',
      type: 'EXPENSE',
    },
  });

  console.log(`✅ Kategori awal dibuat: ${defaultCategory.name}`);
  console.log('---');
  console.log('🚀 SEEDING SELESAI');
}

main()
  .catch((e) => {
    console.error('❌ Gagal Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });