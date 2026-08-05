import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser, loginAndGetCookies } from './utils/auth-helper';

const EMAIL = 'e2e-auth-user@example.com';
const PASSWORD = 'TestPassword123!';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await seedUser(app, EMAIL, PASSWORD);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  it('rejects login with the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'wrong-password' })
      .expect(401);
  });

  it('logs in with correct credentials and sets auth cookies', async () => {
    const cookies = await loginAndGetCookies(app, EMAIL, PASSWORD);
    expect(cookies.some((c) => c.startsWith('access-token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh-token='))).toBe(true);
  });

  it('returns the current user from /users/me when authenticated', async () => {
    const cookies = await loginAndGetCookies(app, EMAIL, PASSWORD);

    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.email).toBe(EMAIL);
  });

  it('rejects /users/me without auth cookies', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('rotates tokens on refresh', async () => {
    const cookies = await loginAndGetCookies(app, EMAIL, PASSWORD);

    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.get('Set-Cookie')).toBeDefined();
  });

  it('logs out successfully', async () => {
    const cookies = await loginAndGetCookies(app, EMAIL, PASSWORD);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookies)
      .expect(200);
  });
});
