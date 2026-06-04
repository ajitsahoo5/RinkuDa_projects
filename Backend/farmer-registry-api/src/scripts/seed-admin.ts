import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123';
  const displayName = process.env.SEED_ADMIN_NAME ?? 'Admin';

  const existing = await usersService.findByEmail(email);
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await app.close();
    return;
  }

  const user = await usersService.create({
    email,
    password,
    displayName,
    role: 'admin',
  });
  console.log(`Created admin user: ${user.email} (${user.uid})`);
  await app.close();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
