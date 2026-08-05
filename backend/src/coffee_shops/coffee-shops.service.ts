import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoffeeShopDto } from './dto/create-coffee-shop.dto';

@Injectable()
export class CoffeeShopsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coffeeShop.findMany({
      include: {
        location: true, // Loads nested coordinates
        photos: true, // Loads associated cloud URLs
      },
    });
  }

  async findById(id: string) {
    const coffeeShop = await this.prisma.coffeeShop.findUnique({
      where: { id },
      include: {
        location: true, // Loads nested coordinates
        photos: true, // Loads associated cloud URLs
      },
    });

    if (!coffeeShop) {
      throw new NotFoundException('CoffeeShop not found');
    }
    return coffeeShop;
  }

  async create(dto: CreateCoffeeShopDto) {
    return this.prisma.coffeeShop.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: { create: dto.location },
        photos: dto.photoUrl ? { create: [{ url: dto.photoUrl }] } : undefined,
      },
      include: {
        location: true,
        photos: true,
      },
    });
  }
}
