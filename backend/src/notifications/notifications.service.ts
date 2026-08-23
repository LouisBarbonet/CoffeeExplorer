import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '../../generated/prisma/client.js';

interface NotificationPayload {
  coffeeShopId?: string;
  visitId?: string;
  beanBagId?: string;
}

const NOTIFICATION_INCLUDE = {
  actor: { select: { id: true, name: true, avatarUrl: true } },
  coffeeShop: { select: { id: true, name: true } },
  visit: { select: { id: true, coffeeShopId: true } },
  beanBag: { select: { id: true, name: true } },
} as const;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyUsers(
    userIds: string[],
    actorId: string,
    type: NotificationType,
    payload: NotificationPayload = {},
  ) {
    const recipientIds = userIds.filter((id) => id !== actorId);
    if (recipientIds.length === 0) return;

    await this.prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        actorId,
        type,
        ...payload,
      })),
    });
  }

  async notifyUser(
    userId: string,
    actorId: string,
    type: NotificationType,
    payload: NotificationPayload = {},
  ) {
    if (userId === actorId) return;
    await this.prisma.notification.create({
      data: { userId, actorId, type, ...payload },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: NOTIFICATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
