import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser, loginAndGetCookies } from './utils/auth-helper';

const USER_EMAIL = 'e2e-visits-user@example.com';
const USER_PASSWORD = 'TestPassword123!';
const OTHER_USER_EMAIL = 'e2e-visits-user-2@example.com';
const OTHER_USER_PASSWORD = 'TestPassword456!';

describe('Visits (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userCookies: string[];
  let otherUserCookies: string[];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    await seedUser(app, USER_EMAIL, USER_PASSWORD);
    await seedUser(app, OTHER_USER_EMAIL, OTHER_USER_PASSWORD);

    userCookies = await loginAndGetCookies(app, USER_EMAIL, USER_PASSWORD);
    otherUserCookies = await loginAndGetCookies(
      app,
      OTHER_USER_EMAIL,
      OTHER_USER_PASSWORD,
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [USER_EMAIL, OTHER_USER_EMAIL] } },
    });
    await prisma.coffeeShop.deleteMany({
      where: { name: { startsWith: 'E2E Test Shop' } },
    });
    await app.close();
  });

  it('rejects requests with neither coffeeShopId nor newCoffeeShop', async () => {
    await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userCookies)
      .send({ notes: 'no shop reference' })
      .expect(400);
  });

  it('rejects requests with both coffeeShopId and newCoffeeShop', async () => {
    await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userCookies)
      .send({
        coffeeShopId: '00000000-0000-0000-0000-000000000000',
        newCoffeeShop: { name: 'X', location: { latitude: 0, longitude: 0 } },
        notes: 'both provided',
      })
      .expect(400);
  });

  it('creates a new coffee shop and logs a visit in one request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userCookies)
      .send({
        newCoffeeShop: {
          name: 'E2E Test Shop',
          location: { latitude: 45.5, longitude: -73.6 },
        },
        notes: 'first visit',
        rating: 5,
      })
      .expect(201);

    expect(res.body.coffeeShop.name).toBe('E2E Test Shop');
    expect(res.body.notes).toBe('first visit');
    expect(res.body.rating).toBe(5);
  });

  it('logs a repeat visit to the same shop without a unique-constraint error', async () => {
    const shop = await prisma.coffeeShop.findFirstOrThrow({
      where: { name: 'E2E Test Shop' },
    });

    await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userCookies)
      .send({ coffeeShopId: shop.id, notes: 'second visit' })
      .expect(201);

    const visitCount = await prisma.visit.count({
      where: { coffeeShopId: shop.id },
    });
    expect(visitCount).toBe(2);
  });

  it("only returns the requesting user's own visits", async () => {
    const res = await request(app.getHttpServer())
      .get('/api/visits')
      .set('Cookie', otherUserCookies)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('filters visits by coffeeShopId', async () => {
    const shop = await prisma.coffeeShop.findFirstOrThrow({
      where: { name: 'E2E Test Shop' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/visits?coffeeShopId=${shop.id}`)
      .set('Cookie', userCookies)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(
      res.body.every(
        (v: { coffeeShopId: string }) => v.coffeeShopId === shop.id,
      ),
    ).toBe(true);
  });

  it("rejects updating another user's visit", async () => {
    const visit = await prisma.visit.findFirstOrThrow({
      where: { coffeeShop: { name: 'E2E Test Shop' } },
    });

    await request(app.getHttpServer())
      .patch(`/api/visits/${visit.id}`)
      .set('Cookie', otherUserCookies)
      .send({ notes: 'hijacked' })
      .expect(404);
  });

  it('updates notes and rating on your own visit', async () => {
    const visit = await prisma.visit.findFirstOrThrow({
      where: { coffeeShop: { name: 'E2E Test Shop' }, notes: 'first visit' },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/visits/${visit.id}`)
      .set('Cookie', userCookies)
      .send({ notes: 'updated notes', rating: 3 })
      .expect(200);

    expect(res.body.notes).toBe('updated notes');
    expect(res.body.rating).toBe(3);
  });

  it("rejects deleting another user's visit", async () => {
    const visit = await prisma.visit.findFirstOrThrow({
      where: { coffeeShop: { name: 'E2E Test Shop' } },
    });

    await request(app.getHttpServer())
      .delete(`/api/visits/${visit.id}`)
      .set('Cookie', otherUserCookies)
      .expect(404);
  });

  it('deletes a visit and cleans up its photo record, even if the file is missing on disk', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userCookies)
      .send({
        newCoffeeShop: {
          name: 'E2E Test Shop Photo',
          location: { latitude: 1, longitude: 1 },
        },
        photoUrl: '/uploads/does-not-exist-on-disk.png',
      })
      .expect(201);

    const visitId = created.body.id;
    const photoId = created.body.photos[0].id;

    await request(app.getHttpServer())
      .delete(`/api/visits/${visitId}`)
      .set('Cookie', userCookies)
      .expect(204);

    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    expect(photo).toBeNull();
  });

  it('rejects all visit routes without authentication', async () => {
    await request(app.getHttpServer()).get('/api/visits').expect(401);
    await request(app.getHttpServer()).post('/api/visits').send({}).expect(401);
  });
});
