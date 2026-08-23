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
  // Shared across tests that just need a logged-in session -- the login
  // route is throttled to 5 requests/min, so tests reuse one session
  // instead of each calling loginAndGetCookies again.
  let sharedCookies: string[];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await seedUser(app, EMAIL, PASSWORD);
    sharedCookies = await loginAndGetCookies(app, EMAIL, PASSWORD);
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
    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', sharedCookies)
      .expect(200);

    expect(res.body.email).toBe(EMAIL);
  });

  it('rejects /users/me without auth cookies', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('includes visit stats on /users/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', sharedCookies)
      .expect(200);

    expect(res.body.stats).toEqual({ visitCount: 0, shopsVisitedCount: 0 });
  });

  it('updates the display name via PATCH /users/me', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Cookie', sharedCookies)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(res.body.name).toBe('Updated Name');
  });

  it('rotates tokens on refresh', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', sharedCookies)
      .expect(200);

    expect(res.get('Set-Cookie')).toBeDefined();
  });

  it('logs out successfully', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', sharedCookies)
      .expect(200);
  });
});

describe('Signup (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const SIGNUP_EMAIL = 'e2e-signup-user@example.com';
  const SIGNUP_PASSWORD = 'TestPassword123!';
  const SIGNUP_NAME = 'Signup Test User';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: SIGNUP_EMAIL } });
    await app.close();
  });

  it('creates a new account and logs it in', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: SIGNUP_EMAIL,
        password: SIGNUP_PASSWORD,
        name: SIGNUP_NAME,
      })
      .expect(201);

    expect(res.body.user.email).toBe(SIGNUP_EMAIL);
    expect(res.body.user.name).toBe(SIGNUP_NAME);
    const cookies = res.get('Set-Cookie');
    expect(cookies?.some((c) => c.startsWith('access-token='))).toBe(true);
    expect(cookies?.some((c) => c.startsWith('refresh-token='))).toBe(true);
  });

  it('rejects signup with a duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: SIGNUP_EMAIL,
        password: SIGNUP_PASSWORD,
        name: SIGNUP_NAME,
      })
      .expect(409);
  });

  it('rejects signup with a short password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'e2e-signup-short@example.com',
        password: 'short',
        name: 'X',
      })
      .expect(400);
  });

  it('rejects signup with an invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', password: SIGNUP_PASSWORD, name: 'X' })
      .expect(400);
  });
});
