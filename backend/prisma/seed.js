import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encrypt, monthlyToHourly } from '../src/utils/encryption.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const company = await prisma.company.create({
    data: {
      name: 'Demo Manufacturing (Pty) Ltd',
      email: 'admin@demomfg.co.za',
      plan: 'pro',
      planStatus: 'active',
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxUsers: 50
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demomfg.co.za',
      passwordHash,
      firstName: 'Thabo',
      lastName: 'Molefe',
      role: 'company_admin',
      companyId: company.id,
      salaryEncrypted: encrypt(45000),
      hourlyRate: monthlyToHourly(45000)
    }
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@demomfg.co.za',
      passwordHash,
      firstName: 'Lerato',
      lastName: 'Nkosi',
      role: 'manager',
      companyId: company.id,
      salaryEncrypted: encrypt(28000),
      hourlyRate: monthlyToHourly(28000)
    }
  });

  await prisma.user.create({
    data: {
      email: 'employee@demomfg.co.za',
      passwordHash,
      firstName: 'Sipho',
      lastName: 'Dlamini',
      role: 'employee',
      companyId: company.id,
      managerId: manager.id,
      salaryEncrypted: encrypt(12000),
      hourlyRate: monthlyToHourly(12000)
    }
  });

  console.log('Demo company created.');
  console.log('Login credentials (password for all: password123):');
  console.log('  Admin:    admin@demomfg.co.za');
  console.log('  Manager:  manager@demomfg.co.za');
  console.log('  Employee: employee@demomfg.co.za');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
