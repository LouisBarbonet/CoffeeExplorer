import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBeanBagDto } from './dto/create-bean-bag.dto';

@Injectable()
export class BeanBagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.beanBag.findMany({
      include: { photos: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const beanBag = await this.prisma.beanBag.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!beanBag) {
      throw new NotFoundException('BeanBag not found');
    }
    return beanBag;
  }

  async create(dto: CreateBeanBagDto) {
    return this.prisma.beanBag.create({
      data: {
        name: dto.name,
        roaster: dto.roaster,
        origin: dto.origin,
        roastLevel: dto.roastLevel,
        photos: dto.photoUrl ? { create: [{ url: dto.photoUrl }] } : undefined,
      },
      include: { photos: true },
    });
  }
}
