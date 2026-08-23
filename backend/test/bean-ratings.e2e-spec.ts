import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser, loginAndGetCookies } from './utils/auth-helper';

const EMAIL = 'e2e-beans-user@example.com';
const PASSWORD = 'TestPassword123!';

describe('BeanBags & BeanRatings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookies: string[];
  let beanBagId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    await seedUser(app, EMAIL, PASSWORD);
    cookies = await loginAndGetCookies(app, EMAIL, PASSWORD);
  });

  afterAll(async () => {
    await prisma.beanBag.deleteMany({
      where: { name: { startsWith: 'E2E Bean Test' } },
    });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  it('rejects bean-bags and bean-ratings routes without authentication', async () => {
    await request(app.getHttpServer()).get('/api/bean-bags').expect(401);
    await request(app.getHttpServer()).get('/api/bean-ratings').expect(401);
    await request(app.getHttpServer())
      .post('/api/bean-ratings')
      .send({})
      .expect(401);
  });

  it('rates a new bean bag, creating it inline', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/bean-ratings')
      .set('Cookie', cookies)
      .send({
        newBeanBag: {
          name: 'E2E Bean Test Roast',
          roaster: 'Test Roasters',
          origin: 'Ethiopia',
          roastLevel: 'LIGHT',
        },
        rating: 4,
        notes: 'Bright and fruity',
      })
      .expect(201);

    expect(res.body.rating).toBe(4);
    expect(res.body.beanBag.name).toBe('E2E Bean Test Roast');
    beanBagId = res.body.beanBag.id as string;
  });

  it('lists the new bean bag in the shared catalog', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/bean-bags')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.some((b: { id: string }) => b.id === beanBagId)).toBe(true);
  });

  it('updates the existing rating instead of creating a second one when rating the same bag again', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/bean-ratings')
      .set('Cookie', cookies)
      .send({ beanBagId, rating: 5, notes: 'Even better on day two' })
      .expect(201);

    expect(res.body.rating).toBe(5);

    const list = await request(app.getHttpServer())
      .get('/api/bean-ratings')
      .set('Cookie', cookies)
      .expect(200);
    expect(
      list.body.filter((r: { beanBagId: string }) => r.beanBagId === beanBagId),
    ).toHaveLength(1);
  });

  it('rejects providing both beanBagId and newBeanBag', async () => {
    await request(app.getHttpServer())
      .post('/api/bean-ratings')
      .set('Cookie', cookies)
      .send({ beanBagId, newBeanBag: { name: 'E2E Bean Test Other' } })
      .expect(400);
  });

  it('rejects setting a favourite bean bag the user has not rated', async () => {
    const other = await request(app.getHttpServer())
      .post('/api/bean-bags')
      .set('Cookie', cookies)
      .send({ name: 'E2E Bean Test Unrated' })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Cookie', cookies)
      .send({ favouriteBeanBagId: other.body.id })
      .expect(400);
  });

  it('sets the favourite bean bag once it has been rated', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Cookie', cookies)
      .send({ favouriteBeanBagId: beanBagId })
      .expect(200);

    expect(res.body.favouriteBeanBag.id).toBe(beanBagId);
  });

  it('updates a rating via PATCH /bean-ratings/:id', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/bean-ratings')
      .set('Cookie', cookies)
      .expect(200);
    const ratingId = list.body[0].id as string;

    const res = await request(app.getHttpServer())
      .patch(`/api/bean-ratings/${ratingId}`)
      .set('Cookie', cookies)
      .send({ notes: 'Updated notes' })
      .expect(200);

    expect(res.body.notes).toBe('Updated notes');
  });

  it('deletes a rating via DELETE /bean-ratings/:id', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/bean-ratings')
      .set('Cookie', cookies)
      .expect(200);
    const ratingId = list.body[0].id as string;

    await request(app.getHttpServer())
      .delete(`/api/bean-ratings/${ratingId}`)
      .set('Cookie', cookies)
      .expect(204);

    const after = await request(app.getHttpServer())
      .get('/api/bean-ratings')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.some((r: { id: string }) => r.id === ratingId)).toBe(
      false,
    );
  });
});
