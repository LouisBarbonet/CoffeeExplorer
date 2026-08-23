import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, coffeeShopId: string) {
    const shop = await this.prisma.coffeeShop.findUnique({
      where: { id: coffeeShopId },
    });
    if (!shop) {
      throw new NotFoundException('Coffee shop not found');
    }

    const alreadyVisited = await this.prisma.visit.findFirst({
      where: { userId, coffeeShopId },
    });
    if (alreadyVisited) {
      throw new BadRequestException("You've already visited this coffee shop");
    }

    return this.prisma.wishlistItem.upsert({
      where: { userId_coffeeShopId: { userId, coffeeShopId } },
      update: {},
      create: { userId, coffeeShopId },
      include: { coffeeShop: { include: { location: true, photos: true } } },
    });
  }

  async list(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { coffeeShop: { include: { location: true, photos: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, coffeeShopId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_coffeeShopId: { userId, coffeeShopId } },
    });
    if (!existing) {
      throw new NotFoundException('Wishlist item not found');
    }
    await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
  }
}
