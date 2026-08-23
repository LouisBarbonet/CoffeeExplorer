import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser, loginAndGetCookies } from './utils/auth-helper';

const PASSWORD = 'TestPassword123!';
const A_EMAIL = 'e2e-notif-a@example.com';
const B_EMAIL = 'e2e-notif-b@example.com';
const STRANGER_EMAIL = 'e2e-notif-stranger@example.com';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userA: { id: string; cookies: string[] };
  let userB: { id: string; cookies: string[] };
  let stranger: { id: string; cookies: string[] };

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

    userA = await setUpUser(A_EMAIL, 'Notif Alpha');
    userB = await setUpUser(B_EMAIL, 'Notif Beta');
    stranger = await setUpUser(STRANGER_EMAIL, 'Notif Stranger');
  });

  afterAll(async () => {
    await prisma.coffeeShop.deleteMany({
      where: { name: { startsWith: 'E2E Notif Test' } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [A_EMAIL, B_EMAIL, STRANGER_EMAIL] } },
    });
    await app.close();
  });

  it('notifies the addressee when a buddy request is sent', async () => {
    await request(app.getHttpServer())
      .post('/api/buddies/requests')
      .set('Cookie', userA.cookies)
      .send({ addresseeId: userB.id })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', userB.cookies)
      .expect(200);

    expect(
      res.body.some(
        (n: { type: string; actor: { id: string } }) =>
          n.type === 'BUDDY_REQUEST' && n.actor.id === userA.id,
      ),
    ).toBe(true);

    const unread = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set('Cookie', userB.cookies)
      .expect(200);
    expect(unread.body.count).toBeGreaterThan(0);
  });

  it('notifies the requester when their request is accepted', async () => {
    const incoming = await request(app.getHttpServer())
      .get('/api/buddies/requests/incoming')
      .set('Cookie', userB.cookies)
      .expect(200);
    const requestId = incoming.body[0].id as string;

    await request(app.getHttpServer())
      .post(`/api/buddies/requests/${requestId}/accept`)
      .set('Cookie', userB.cookies)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', userA.cookies)
      .expect(200);

    expect(
      res.body.some(
        (n: { type: string; actor: { id: string } }) =>
          n.type === 'BUDDY_ACCEPTED' && n.actor.id === userB.id,
      ),
    ).toBe(true);
  });

  it('notifies buddies (not strangers) about a new shop + visit', async () => {
    const visitRes = await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userA.cookies)
      .send({ newCoffeeShop: { name: 'E2E Notif Test Cafe' } })
      .expect(201);
    const coffeeShopId = visitRes.body.coffeeShopId as string;

    const bNotifs = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', userB.cookies)
      .expect(200);
    expect(
      bNotifs.body.some(
        (n: { type: string; coffeeShopId: string }) =>
          n.type === 'NEW_SHOP' && n.coffeeShopId === coffeeShopId,
      ),
    ).toBe(true);
    expect(
      bNotifs.body.some(
        (n: { type: string; coffeeShopId: string }) =>
          n.type === 'NEW_VISIT' && n.coffeeShopId === coffeeShopId,
      ),
    ).toBe(true);

    const strangerNotifs = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', stranger.cookies)
      .expect(200);
    expect(
      strangerNotifs.body.some(
        (n: { coffeeShopId: string }) => n.coffeeShopId === coffeeShopId,
      ),
    ).toBe(false);
  });

  it('notifies buddies about a new bean rating, but not on re-rating the same bag', async () => {
    const ratingRes = await request(app.getHttpServer())
      .post('/api/bean-ratings')
      .set('Cookie', userA.cookies)
      .send({
        newBeanBag: { name: 'E2E Notif Test Beans' },
        rating: 4,
      })
      .expect(201);
    const beanBagId = ratingRes.body.beanBag.id as string;

    const bNotifs = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', userB.cookies)
      .expect(200);
    const beanNotifs = bNotifs.body.filter(
      (n: { type: string; beanBagId: string }) =>
        n.type === 'NEW_BEAN_RATING' && n.beanBagId === beanBagId,
    );
    expect(beanNotifs).toHaveLength(1);

    // Re-rating the same bag should not create a second notification.
    await request(app.getHttpServer())
      .post('/api/bean-ratings')
      .set('Cookie', userA.cookies)
      .send({ beanBagId, rating: 5 })
      .expect(201);

    const bNotifsAfter = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', userB.cookies)
      .expect(200);
    const beanNotifsAfter = bNotifsAfter.body.filter(
      (n: { type: string; beanBagId: string }) =>
        n.type === 'NEW_BEAN_RATING' && n.beanBagId === beanBagId,
    );
    expect(beanNotifsAfter).toHaveLength(1);

    await prisma.beanBag.deleteMany({
      where: { name: 'E2E Notif Test Beans' },
    });
  });

  it('marks a single notification read, and marks all read', async () => {
    const before = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', userB.cookies)
      .expect(200);
    expect(before.body.length).toBeGreaterThan(0);
    const firstId = before.body[0].id as string;

    await request(app.getHttpServer())
      .post(`/api/notifications/${firstId}/read`)
      .set('Cookie', userB.cookies)
      .expect(200);

    const afterOne = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', userB.cookies)
      .expect(200);
    expect(
      afterOne.body.find((n: { id: string }) => n.id === firstId).read,
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/api/notifications/read-all')
      .set('Cookie', userB.cookies)
      .expect(200);

    const unread = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set('Cookie', userB.cookies)
      .expect(200);
    expect(unread.body.count).toBe(0);
  });
});
