import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BeanBagsService } from '../bean_bags/bean-bags.service';
import { BuddiesService } from '../buddies/buddies.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBeanRatingDto } from './dto/create-bean-rating.dto';
import { UpdateBeanRatingDto } from './dto/update-bean-rating.dto';

@Injectable()
export class BeanRatingsService {
  constructor(
    private prisma: PrismaService,
    private beanBagsService: BeanBagsService,
    private buddiesService: BuddiesService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateBeanRatingDto) {
    const hasExisting = Boolean(dto.beanBagId);
    const hasNew = Boolean(dto.newBeanBag);

    if (hasExisting == hasNew) {
      throw new BadRequestException(
        'Provide exactly one of beanBagId or newBeanBag',
      );
    }

    const beanBagId =
      dto.beanBagId ?? (await this.beanBagsService.create(dto.newBeanBag!)).id;

    const isNewRating = !(await this.prisma.beanRating.findUnique({
      where: { userId_beanBagId: { userId, beanBagId } },
    }));

    // Ratings are persistent-per-bag, not repeatable like visits -- rating
    // an already-rated bag again just updates that one row.
    const rating = await this.prisma.beanRating.upsert({
      where: { userId_beanBagId: { userId, beanBagId } },
      update: { rating: dto.rating, notes: dto.notes },
      create: { userId, beanBagId, rating: dto.rating, notes: dto.notes },
      include: { beanBag: { include: { photos: true } } },
    });

    if (isNewRating) {
      const buddyIds = await this.buddiesService.getBuddyIds(userId);
      await this.notificationsService.notifyUsers(
        buddyIds,
        userId,
        'NEW_BEAN_RATING',
        { beanBagId },
      );
    }

    return rating;
  }

  async findAllForUser(userId: string) {
    return this.prisma.beanRating.findMany({
      where: { userId },
      include: { beanBag: { include: { photos: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, ratingId: string, dto: UpdateBeanRatingDto) {
    const rating = await this.prisma.beanRating.findUnique({
      where: { id: ratingId },
    });
    if (!rating || rating.userId !== userId) {
      throw new NotFoundException('Bean rating not found');
    }

    return this.prisma.beanRating.update({
      where: { id: ratingId },
      data: { rating: dto.rating, notes: dto.notes },
      include: { beanBag: { include: { photos: true } } },
    });
  }

  async remove(userId: string, ratingId: string) {
    const rating = await this.prisma.beanRating.findUnique({
      where: { id: ratingId },
    });
    if (!rating || rating.userId !== userId) {
      throw new NotFoundException('Bean rating not found');
    }
    await this.prisma.beanRating.delete({ where: { id: ratingId } });
  }
}
