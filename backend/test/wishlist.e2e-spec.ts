import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser, loginAndGetCookies } from './utils/auth-helper';

const PASSWORD = 'TestPassword123!';
const USER_EMAIL = 'e2e-wishlist-user@example.com';
const BUDDY_EMAIL = 'e2e-wishlist-buddy@example.com';

describe('Wishlist (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user: { id: string; cookies: string[] };
  let buddy: { id: string; cookies: string[] };
  let coffeeShopId: string;

  async function setUpUser(email: string, name: string) {
    await seedUser(app, email, PASSWORD, name);
    const cookies = await loginAndGetCookies(app, email, PASSWORD);
    const me = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', cookies)
      .expect(200);
    return { id: me.body.id as string, cookies };
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    user = await setUpUser(USER_EMAIL, 'Wishlist User');
    buddy = await setUpUser(BUDDY_EMAIL, 'Wishlist Buddy');

    // Make them mutual buddies.
    await request(app.getHttpServer())
      .post('/api/buddies/requests')
      .set('Cookie', user.cookies)
      .send({ addresseeId: buddy.id })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/buddies/requests')
      .set('Cookie', buddy.cookies)
      .send({ addresseeId: user.id })
      .expect(201);

    // Buddy visits a shop the main user hasn't been to.
    const visitRes = await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', buddy.cookies)
      .send({ newCoffeeShop: { name: 'E2E Wishlist Test Cafe' } })
      .expect(201);
    coffeeShopId = visitRes.body.coffeeShopId as string;
  });

  afterAll(async () => {
    await prisma.coffeeShop.deleteMany({
      where: { name: 'E2E Wishlist Test Cafe' },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [USER_EMAIL, BUDDY_EMAIL] } },
    });
    await app.close();
  });

  it("shows the buddy's shop in GET /visits/buddies, annotated with who visited", async () => {
    const res = await request(app.getHttpServer())
      .get('/api/visits/buddies')
      .set('Cookie', user.cookies)
      .expect(200);

    const entry = res.body.find(
      (e: { coffeeShop: { id: string } }) => e.coffeeShop.id === coffeeShopId,
    );
    expect(entry).toBeDefined();
    expect(entry.visitedBy.some((u: { id: string }) => u.id === buddy.id)).toBe(
      true,
    );
  });

  it('adds the shop to the wishlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/wishlist')
      .set('Cookie', user.cookies)
      .send({ coffeeShopId })
      .expect(201);

    expect(res.body.coffeeShopId).toBe(coffeeShopId);
  });

  it('is idempotent when wishlisting the same shop twice', async () => {
    await request(app.getHttpServer())
      .post('/api/wishlist')
      .set('Cookie', user.cookies)
      .send({ coffeeShopId })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/wishlist')
      .set('Cookie', user.cookies)
      .expect(200);
    expect(
      res.body.filter(
        (w: { coffeeShopId: string }) => w.coffeeShopId === coffeeShopId,
      ),
    ).toHaveLength(1);
  });

  it('rejects wishlisting a shop already visited', async () => {
    await request(app.getHttpServer())
      .post('/api/wishlist')
      .set('Cookie', buddy.cookies)
      .send({ coffeeShopId })
      .expect(400);
  });

  it('removes the shop from the wishlist', async () => {
    await request(app.getHttpServer())
      .delete(`/api/wishlist/${coffeeShopId}`)
      .set('Cookie', user.cookies)
      .expect(204);

    const res = await request(app.getHttpServer())
      .get('/api/wishlist')
      .set('Cookie', user.cookies)
      .expect(200);
    expect(
      res.body.some(
        (w: { coffeeShopId: string }) => w.coffeeShopId === coffeeShopId,
      ),
    ).toBe(false);
  });

  it('auto-removes a wishlist entry once the user actually visits the shop', async () => {
    await request(app.getHttpServer())
      .post('/api/wishlist')
      .set('Cookie', user.cookies)
      .send({ coffeeShopId })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', user.cookies)
      .send({ coffeeShopId })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/wishlist')
      .set('Cookie', user.cookies)
      .expect(200);
    expect(
      res.body.some(
        (w: { coffeeShopId: string }) => w.coffeeShopId === coffeeShopId,
      ),
    ).toBe(false);
  });
});
