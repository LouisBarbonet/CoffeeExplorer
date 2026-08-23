import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { BuddiesService } from '../buddies/buddies.service';

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  favouriteBeanBag: true,
} as const;

const SEARCH_RESULT_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buddiesService: BuddiesService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PROFILE_SELECT,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.getVisitStats(id);
    return { ...user, stats };
  }

  async findProfileFor(requesterId: string, targetId: string) {
    if (requesterId !== targetId) {
      const buddies = await this.buddiesService.isBuddy(requesterId, targetId);
      if (!buddies) {
        throw new NotFoundException('User not found');
      }
    }
    return this.findById(targetId);
  }

  async search(requesterId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const results = await this.prisma.user.findMany({
      where: {
        id: { not: requesterId },
        OR: [
          { email: { contains: trimmed, mode: 'insensitive' } },
          { name: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: SEARCH_RESULT_SELECT,
      take: 20,
    });
    if (results.length === 0) return [];

    const ids = results.map((r) => r.id);
    const relations = await this.prisma.buddyRequest.findMany({
      where: {
        OR: [
          { requesterId, addresseeId: { in: ids } },
          { addresseeId: requesterId, requesterId: { in: ids } },
        ],
      },
    });

    return results.map((user) => {
      const relation = relations.find(
        (r) => r.requesterId === user.id || r.addresseeId === user.id,
      );
      let relationshipStatus:
        'none' | 'pending_sent' | 'pending_received' | 'buddies' = 'none';
      if (relation) {
        if (relation.status === 'ACCEPTED') {
          relationshipStatus = 'buddies';
        } else if (relation.status === 'PENDING') {
          relationshipStatus =
            relation.requesterId === requesterId
              ? 'pending_sent'
              : 'pending_received';
        }
      }
      return { ...user, relationshipStatus };
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    if (dto.favouriteBeanBagId) {
      const rating = await this.prisma.beanRating.findUnique({
        where: {
          userId_beanBagId: { userId: id, beanBagId: dto.favouriteBeanBagId },
        },
      });
      if (!rating) {
        throw new BadRequestException(
          'You can only favourite a bean bag you have rated',
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        avatarUrl: dto.avatarUrl,
        favouriteBeanBagId: dto.favouriteBeanBagId,
      },
      select: PROFILE_SELECT,
    });

    const stats = await this.getVisitStats(id);
    return { ...user, stats };
  }

  private async getVisitStats(userId: string) {
    const [visitCount, shopsVisited] = await Promise.all([
      this.prisma.visit.count({ where: { userId } }),
      this.prisma.visit.findMany({
        where: { userId },
        distinct: ['coffeeShopId'],
        select: { coffeeShopId: true },
      }),
    ]);

    return { visitCount, shopsVisitedCount: shopsVisited.length };
  }
}
