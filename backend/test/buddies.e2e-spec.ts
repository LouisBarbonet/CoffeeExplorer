import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser, loginAndGetCookies } from './utils/auth-helper';

const PASSWORD = 'TestPassword123!';

const A_EMAIL = 'e2e-buddies-a@example.com';
const B_EMAIL = 'e2e-buddies-b@example.com';
const C_EMAIL = 'e2e-buddies-c@example.com';
const MUTUAL_X_EMAIL = 'e2e-buddies-mutual-x@example.com';
const MUTUAL_Y_EMAIL = 'e2e-buddies-mutual-y@example.com';

describe('Buddies (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userA: { id: string; cookies: string[] };
  let userB: { id: string; cookies: string[] };
  let userC: { id: string; cookies: string[] };
  let mutualX: { id: string; cookies: string[] };
  let mutualY: { id: string; cookies: string[] };

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

    userA = await setUpUser(A_EMAIL, 'Buddy Alpha');
    userB = await setUpUser(B_EMAIL, 'Buddy Beta');
    userC = await setUpUser(C_EMAIL, 'Buddy Charlie');
    mutualX = await setUpUser(MUTUAL_X_EMAIL, 'Mutual X');
    mutualY = await setUpUser(MUTUAL_Y_EMAIL, 'Mutual Y');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [A_EMAIL, B_EMAIL, C_EMAIL, MUTUAL_X_EMAIL, MUTUAL_Y_EMAIL],
        },
      },
    });
    await app.close();
  });

  it('finds a user by search and reports no relationship yet', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/search?q=Buddy Beta')
      .set('Cookie', userA.cookies)
      .expect(200);

    const match = res.body.find((u: { id: string }) => u.id === userB.id);
    expect(match).toBeDefined();
    expect(match.relationshipStatus).toBe('none');
  });

  it('sends a buddy request from A to B', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/buddies/requests')
      .set('Cookie', userA.cookies)
      .send({ addresseeId: userB.id })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
  });

  it('reflects the pending request in search results for both sides', async () => {
    const asA = await request(app.getHttpServer())
      .get('/api/users/search?q=Buddy Beta')
      .set('Cookie', userA.cookies)
      .expect(200);
    expect(
      asA.body.find((u: { id: string }) => u.id === userB.id)
        .relationshipStatus,
    ).toBe('pending_sent');

    const asB = await request(app.getHttpServer())
      .get('/api/users/search?q=Buddy Alpha')
      .set('Cookie', userB.cookies)
      .expect(200);
    expect(
      asB.body.find((u: { id: string }) => u.id === userA.id)
        .relationshipStatus,
    ).toBe('pending_received');
  });

  it('shows the incoming request to B', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/buddies/requests/incoming')
      .set('Cookie', userB.cookies)
      .expect(200);

    expect(
      res.body.some(
        (r: { requester: { id: string } }) => r.requester.id === userA.id,
      ),
    ).toBe(true);
  });

  it('lets B accept the request, making A and B buddies', async () => {
    const incoming = await request(app.getHttpServer())
      .get('/api/buddies/requests/incoming')
      .set('Cookie', userB.cookies)
      .expect(200);
    const requestId = incoming.body[0].id as string;

    await request(app.getHttpServer())
      .post(`/api/buddies/requests/${requestId}/accept`)
      .set('Cookie', userB.cookies)
      .expect(201);

    const aBuddies = await request(app.getHttpServer())
      .get('/api/buddies')
      .set('Cookie', userA.cookies)
      .expect(200);
    expect(aBuddies.body.some((u: { id: string }) => u.id === userB.id)).toBe(
      true,
    );

    const bBuddies = await request(app.getHttpServer())
      .get('/api/buddies')
      .set('Cookie', userB.cookies)
      .expect(200);
    expect(bBuddies.body.some((u: { id: string }) => u.id === userA.id)).toBe(
      true,
    );
  });

  it('lets A view B profile now that they are buddies, but blocks C', async () => {
    await request(app.getHttpServer())
      .get(`/api/users/${userB.id}`)
      .set('Cookie', userA.cookies)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/users/${userB.id}`)
      .set('Cookie', userC.cookies)
      .expect(404);
  });

  it('auto-accepts when both sides send a request to each other', async () => {
    await request(app.getHttpServer())
      .post('/api/buddies/requests')
      .set('Cookie', mutualX.cookies)
      .send({ addresseeId: mutualY.id })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/buddies/requests')
      .set('Cookie', mutualY.cookies)
      .send({ addresseeId: mutualX.id })
      .expect(201);

    expect(res.body.status).toBe('ACCEPTED');

    const xBuddies = await request(app.getHttpServer())
      .get('/api/buddies')
      .set('Cookie', mutualX.cookies)
      .expect(200);
    expect(xBuddies.body.some((u: { id: string }) => u.id === mutualY.id)).toBe(
      true,
    );
  });

  it('lets A tag B as a companion on a new visit', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userA.cookies)
      .send({
        newCoffeeShop: { name: 'E2E Buddies Test Cafe' },
        companionIds: [userB.id],
      })
      .expect(201);

    expect(res.body.companions).toHaveLength(1);
    expect(res.body.companions[0].id).toBe(userB.id);

    await prisma.coffeeShop.deleteMany({
      where: { name: 'E2E Buddies Test Cafe' },
    });
  });

  it('rejects tagging a non-buddy as a companion', async () => {
    await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', userA.cookies)
      .send({
        newCoffeeShop: { name: 'E2E Buddies Test Cafe 2' },
        companionIds: [userC.id],
      })
      .expect(400);
  });

  it('unfriends via DELETE /buddies/:userId', async () => {
    await request(app.getHttpServer())
      .delete(`/api/buddies/${userB.id}`)
      .set('Cookie', userA.cookies)
      .expect(200);

    const aBuddies = await request(app.getHttpServer())
      .get('/api/buddies')
      .set('Cookie', userA.cookies)
      .expect(200);
    expect(aBuddies.body.some((u: { id: string }) => u.id === userB.id)).toBe(
      false,
    );
  });
});
