import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser, loginAndGetCookies } from './utils/auth-helper';

const USER_EMAIL = 'e2e-coffee-shops-user@example.com';
const USER_PASSWORD = 'TestPassword123!';

describe('CoffeeShops (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookies: string[];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    await seedUser(app, USER_EMAIL, USER_PASSWORD);
    cookies = await loginAndGetCookies(app, USER_EMAIL, USER_PASSWORD);
  });

  afterAll(async () => {
    await prisma.coffeeShop.deleteMany({
      where: { name: { startsWith: 'E2E CoffeeShop Test' } },
    });
    await prisma.user.deleteMany({ where: { email: USER_EMAIL } });
    await app.close();
  });

  it('rejects all coffee-shops routes without authentication', async () => {
    await request(app.getHttpServer()).get('/api/coffee-shops').expect(401);
    await request(app.getHttpServer())
      .post('/api/coffee-shops')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/coffee-shops/00000000-0000-0000-0000-000000000000')
      .expect(401);
  });

  it('rejects creating a shop without a name', async () => {
    await request(app.getHttpServer())
      .post('/api/coffee-shops')
      .set('Cookie', cookies)
      .send({ location: { latitude: 45, longitude: -73 } })
      .expect(400);
  });

  it('rejects creating a shop with an out-of-range latitude', async () => {
    await request(app.getHttpServer())
      .post('/api/coffee-shops')
      .set('Cookie', cookies)
      .send({
        name: 'E2E CoffeeShop Test Bad Lat',
        location: { latitude: 200, longitude: -73 },
      })
      .expect(400);
  });

  it('creates a shop with only a name and coordinates, leaving address/city/country null', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/coffee-shops')
      .set('Cookie', cookies)
      .send({
        name: 'E2E CoffeeShop Test Minimal',
        location: { latitude: 45.5, longitude: -73.6 },
      })
      .expect(201);

    expect(res.body.name).toBe('E2E CoffeeShop Test Minimal');
    expect(res.body.location.address).toBeNull();
    expect(res.body.location.city).toBeNull();
    expect(res.body.location.country).toBeNull();
  });

  it('creates a shop with full details', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/coffee-shops')
      .set('Cookie', cookies)
      .send({
        name: 'E2E CoffeeShop Test Full',
        description: 'A nice cafe',
        location: {
          address: '123 Main St',
          city: 'Montreal',
          country: 'Canada',
          latitude: 45.5,
          longitude: -73.6,
        },
      })
      .expect(201);

    expect(res.body.description).toBe('A nice cafe');
    expect(res.body.location.address).toBe('123 Main St');
  });

  it('lists all coffee shops, including newly created ones', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/coffee-shops')
      .set('Cookie', cookies)
      .expect(200);

    const names = res.body.map((shop: { name: string }) => shop.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'E2E CoffeeShop Test Minimal',
        'E2E CoffeeShop Test Full',
      ]),
    );
  });

  it('fetches a single shop by id with its location and photos', async () => {
    const shop = await prisma.coffeeShop.findFirstOrThrow({
      where: { name: 'E2E CoffeeShop Test Full' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/coffee-shops/${shop.id}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.id).toBe(shop.id);
    expect(res.body.location.city).toBe('Montreal');
    expect(res.body.photos).toEqual([]);
  });

  it('returns 404 for a coffee shop that does not exist', async () => {
    await request(app.getHttpServer())
      .get('/api/coffee-shops/00000000-0000-0000-0000-000000000000')
      .set('Cookie', cookies)
      .expect(404);
  });
});
