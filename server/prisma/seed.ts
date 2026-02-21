import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...');

  // Create default admin/manager user
  const hashedPassword = await bcrypt.hash('Admin@1234', 12);

  const manager = await prisma.user.upsert({
    where: { email: 'admin@fleetflow.com' },
    update: {},
    create: {
      name: 'Fleet Admin',
      email: 'admin@fleetflow.com',
      passwordHash: hashedPassword,
      role: 'MANAGER',
      isActive: true,
    },
  });

  console.log(`✅  Manager created: ${manager.email}`);

  // Create a dispatcher
  const dispatcherPassword = await bcrypt.hash('Dispatch@1234', 12);
  const dispatcher = await prisma.user.upsert({
    where: { email: 'dispatcher@fleetflow.com' },
    update: {},
    create: {
      name: 'Jane Dispatcher',
      email: 'dispatcher@fleetflow.com',
      passwordHash: dispatcherPassword,
      role: 'DISPATCHER',
      isActive: true,
    },
  });

  console.log(`✅  Dispatcher created: ${dispatcher.email}`);
  console.log('\n📋  Default credentials:');
  console.log('    Manager  : admin@fleetflow.com / Admin@1234');
  console.log('    Dispatcher: dispatcher@fleetflow.com / Dispatch@1234');
  console.log('\n⚠️   Change these passwords immediately in production!\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });