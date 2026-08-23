import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { PrismaService } from '../../src/prisma/prisma.service';

export const TEST_USER_EMAIL = 'e2e-test-user@example.com';
export const TEST_USER_PASSWORD = 'TestPassword123!';

export const TEST_USER_2_EMAIL = 'e2e-test-user-2@example.com';
export const TEST_USER_2_PASSWORD = 'TestPassword456!';

export async function seedUser(
  app: INestApplication,
  email: string,
  password: string,
  name: string = email.split('@')[0],
) {
  const prisma = app.get(PrismaService);
  const passwordHash = await argon2.hash(password);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name },
  });
}

export async function loginAndGetCookies(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string[]> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const cookies = res.get('Set-Cookie');
  if (!cookies) throw new Error('Login did not return cookies');
  return cookies;
}
