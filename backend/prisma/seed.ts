import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin user');
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.upsert({
        where: {email},
        update: {passwordHash},
        create: {email, passwordHash},
    });

    console.log(`Seeded admin user: ${user.email}`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
.finally(async () => {
    await prisma.$disconnect();
});