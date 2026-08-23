import { join } from 'path';
import { unlink } from 'fs/promises';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoffeeShopsService } from '../coffee_shops/coffee-shops.service';
import { BuddiesService } from '../buddies/buddies.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

const COMPANION_SELECT = { id: true, name: true, avatarUrl: true } as const;

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private coffeeShopsService: CoffeeShopsService,
    private buddiesService: BuddiesService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateVisitDto) {
    const hasExisting = Boolean(dto.coffeeShopId);
    const hasNew = Boolean(dto.newCoffeeShop);

    if (hasExisting == hasNew) {
      throw new BadRequestException(
        'Provide exactly one of coffeeShopId or newCoffeeShop',
      );
    }

    const companionIds = await this.validateCompanions(
      userId,
      dto.companionIds,
    );

    const coffeeShopId =
      dto.coffeeShopId ??
      (await this.coffeeShopsService.create(dto.newCoffeeShop!)).id;

    const visit = await this.prisma.visit.create({
      data: {
        userId,
        coffeeShopId,
        visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : undefined,
        notes: dto.notes,
        rating: dto.rating,
        photos: dto.photoUrl ? { create: [{ url: dto.photoUrl }] } : undefined,
        companions: companionIds
          ? { connect: companionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        coffeeShop: { include: { location: true, photos: true } },
        photos: true,
        companions: { select: COMPANION_SELECT },
      },
    });

    await this.prisma.wishlistItem.deleteMany({
      where: { userId, coffeeShopId },
    });

    const buddyIds = await this.buddiesService.getBuddyIds(userId);
    if (hasNew) {
      await this.notificationsService.notifyUsers(
        buddyIds,
        userId,
        'NEW_SHOP',
        { coffeeShopId },
      );
    }
    await this.notificationsService.notifyUsers(buddyIds, userId, 'NEW_VISIT', {
      visitId: visit.id,
      coffeeShopId,
    });

    return visit;
  }

  private async validateCompanions(
    userId: string,
    companionIds: string[] | undefined,
  ): Promise<string[] | undefined> {
    if (!companionIds) return undefined;
    if (companionIds.length === 0) return [];

    const buddyIds = new Set(await this.buddiesService.getBuddyIds(userId));
    const invalid = companionIds.filter((id) => !buddyIds.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        'companionIds must all be accepted buddies',
      );
    }
    return companionIds;
  }

  async findAllForUser(userId: string, coffeeShopId?: string) {
    return this.prisma.visit.findMany({
      where: {
        userId,
        ...(coffeeShopId ? { coffeeShopId } : {}),
      },
      include: {
        coffeeShop: { include: { location: true, photos: true } },
        photos: true,
        companions: { select: COMPANION_SELECT },
      },
      orderBy: { visitedAt: 'desc' },
    });
  }

  async findBuddyVisitedShops(userId: string) {
    const buddyIds = await this.buddiesService.getBuddyIds(userId);
    if (buddyIds.length === 0) return [];

    const myVisitedShopIds = new Set(
      (
        await this.prisma.visit.findMany({
          where: { userId },
          distinct: ['coffeeShopId'],
          select: { coffeeShopId: true },
        })
      ).map((v) => v.coffeeShopId),
    );

    const buddyVisits = await this.prisma.visit.findMany({
      where: { userId: { in: buddyIds } },
      select: {
        coffeeShopId: true,
        coffeeShop: { include: { location: true, photos: true } },
        user: { select: COMPANION_SELECT },
      },
    });

    const byShop = new Map<
      string,
      {
        coffeeShop: (typeof buddyVisits)[number]['coffeeShop'];
        visitedBy: Map<string, (typeof buddyVisits)[number]['user']>;
      }
    >();

    for (const visit of buddyVisits) {
      if (myVisitedShopIds.has(visit.coffeeShopId)) continue;

      let entry = byShop.get(visit.coffeeShopId);
      if (!entry) {
        entry = { coffeeShop: visit.coffeeShop, visitedBy: new Map() };
        byShop.set(visit.coffeeShopId, entry);
      }
      entry.visitedBy.set(visit.user.id, visit.user);
    }

    return Array.from(byShop.values()).map((entry) => ({
      coffeeShop: entry.coffeeShop,
      visitedBy: Array.from(entry.visitedBy.values()),
    }));
  }

  async update(userId: string, visitId: string, dto: UpdateVisitDto) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit || visit.userId !== userId) {
      throw new NotFoundException('Visit not found');
    }

    const companionIds = await this.validateCompanions(
      userId,
      dto.companionIds,
    );

    return this.prisma.visit.update({
      where: { id: visitId },
      data: {
        notes: dto.notes,
        visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : undefined,
        rating: dto.rating,
        companions: companionIds
          ? { set: companionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        coffeeShop: { include: { location: true, photos: true } },
        photos: true,
        companions: { select: COMPANION_SELECT },
      },
    });
  }

  async remove(userId: string, visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { photos: true },
    });
    if (!visit || visit.userId !== userId) {
      throw new NotFoundException('Visit not found');
    }

    await this.prisma.visit.delete({ where: { id: visitId } });

    await Promise.all(
      visit.photos.map((photo) => {
        const filename = photo.url.replace(/^\/uploads\//, '');
        return unlink(join(process.cwd(), 'uploads', filename)).catch(() => {
          // File may already be missing -- DB cleanup already succeeded either way.
        });
      }),
    );
  }
}
