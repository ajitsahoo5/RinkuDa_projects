import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firebaseUid = process.env.SEED_PLATFORM_FIREBASE_UID?.trim();
  if (!firebaseUid) {
    console.warn('Skip seed: set SEED_PLATFORM_FIREBASE_UID to create platform admin.');
    return;
  }

  await prisma.user.upsert({
    where: { firebaseUid },
    update: {
      email: process.env.SEED_PLATFORM_EMAIL ?? undefined,
      displayName: process.env.SEED_PLATFORM_NAME ?? undefined,
      role: UserRole.PLATFORM_SUPER_ADMIN,
      businessId: null,
      isActive: true,
    },
    create: {
      firebaseUid,
      email: process.env.SEED_PLATFORM_EMAIL ?? 'platform@example.com',
      displayName: process.env.SEED_PLATFORM_NAME ?? 'Platform Admin',
      role: UserRole.PLATFORM_SUPER_ADMIN,
      businessId: null,
    },
  });

  console.log('Platform SUPER_ADMIN seeded.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
