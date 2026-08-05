import { join } from 'path';
import { unlink } from 'fs/promises';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoffeeShopsService } from '../coffee_shops/coffee-shops.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private coffeeShopsService: CoffeeShopsService,
  ) {}

  async create(userId: string, dto: CreateVisitDto) {
    const hasExisting = Boolean(dto.coffeeShopId);
    const hasNew = Boolean(dto.newCoffeeShop);

    if (hasExisting == hasNew) {
      throw new BadRequestException(
        'Provide exactly one of coffeeShopId or newCoffeeShop',
      );
    }

    const coffeeShopId =
      dto.coffeeShopId ??
      (await this.coffeeShopsService.create(dto.newCoffeeShop!)).id;

    return this.prisma.visit.create({
      data: {
        userId,
        coffeeShopId,
        visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : undefined,
        notes: dto.notes,
        rating: dto.rating,
        photos: dto.photoUrl ? { create: [{ url: dto.photoUrl }] } : undefined,
      },
      include: {
        coffeeShop: { include: { location: true, photos: true } },
        photos: true,
      },
    });
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
      },
      orderBy: { visitedAt: 'desc' },
    });
  }

  async update(userId: string, visitId: string, dto: UpdateVisitDto) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit || visit.userId !== userId) {
      throw new NotFoundException('Visit not found');
    }

    return this.prisma.visit.update({
      where: { id: visitId },
      data: {
        notes: dto.notes,
        visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : undefined,
        rating: dto.rating,
      },
      include: {
        coffeeShop: { include: { location: true, photos: true } },
        photos: true,
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
