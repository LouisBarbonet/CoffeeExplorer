import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const BUDDY_SUMMARY_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

@Injectable()
export class BuddiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('You cannot buddy-request yourself');
    }

    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
    });
    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    // If the other user already sent us a pending request, this is mutual
    // intent -- auto-accept their request instead of creating a new one.
    const reverse = await this.prisma.buddyRequest.findUnique({
      where: {
        requesterId_addresseeId: {
          requesterId: addresseeId,
          addresseeId: requesterId,
        },
      },
    });
    if (reverse && reverse.status === 'PENDING') {
      const updated = await this.prisma.buddyRequest.update({
        where: { id: reverse.id },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
      await this.notificationsService.notifyUser(
        reverse.requesterId,
        requesterId,
        'BUDDY_ACCEPTED',
      );
      return updated;
    }

    const existing = await this.prisma.buddyRequest.findUnique({
      where: {
        requesterId_addresseeId: { requesterId, addresseeId },
      },
    });

    if (existing) {
      if (existing.status === 'DECLINED') {
        const updated = await this.prisma.buddyRequest.update({
          where: { id: existing.id },
          data: { status: 'PENDING', respondedAt: null },
        });
        await this.notificationsService.notifyUser(
          addresseeId,
          requesterId,
          'BUDDY_REQUEST',
        );
        return updated;
      }
      // Already PENDING or ACCEPTED -- nothing to do.
      return existing;
    }

    const created = await this.prisma.buddyRequest.create({
      data: { requesterId, addresseeId },
    });
    await this.notificationsService.notifyUser(
      addresseeId,
      requesterId,
      'BUDDY_REQUEST',
    );
    return created;
  }

  async listIncoming(userId: string) {
    return this.prisma.buddyRequest.findMany({
      where: { addresseeId: userId, status: 'PENDING' },
      include: { requester: { select: BUDDY_SUMMARY_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(userId: string, requestId: string) {
    const req = await this.findOwnPendingRequest(userId, requestId);
    const updated = await this.prisma.buddyRequest.update({
      where: { id: req.id },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });
    await this.notificationsService.notifyUser(
      req.requesterId,
      userId,
      'BUDDY_ACCEPTED',
    );
    return updated;
  }

  async decline(userId: string, requestId: string) {
    const req = await this.findOwnPendingRequest(userId, requestId);
    return this.prisma.buddyRequest.update({
      where: { id: req.id },
      data: { status: 'DECLINED', respondedAt: new Date() },
    });
  }

  async listBuddies(userId: string) {
    const rows = await this.prisma.buddyRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: BUDDY_SUMMARY_SELECT },
        addressee: { select: BUDDY_SUMMARY_SELECT },
      },
    });

    return rows.map((row) =>
      row.requesterId === userId ? row.addressee : row.requester,
    );
  }

  async getBuddyIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.buddyRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });

    return rows.map((row) =>
      row.requesterId === userId ? row.addresseeId : row.requesterId,
    );
  }

  async isBuddy(userId: string, otherUserId: string): Promise<boolean> {
    const row = await this.prisma.buddyRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async removeBuddy(userId: string, otherUserId: string) {
    const row = await this.prisma.buddyRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });
    if (!row) {
      throw new NotFoundException('Buddy not found');
    }
    await this.prisma.buddyRequest.delete({ where: { id: row.id } });
  }

  private async findOwnPendingRequest(userId: string, requestId: string) {
    const req = await this.prisma.buddyRequest.findUnique({
      where: { id: requestId },
    });
    if (!req || req.addresseeId !== userId || req.status !== 'PENDING') {
      throw new NotFoundException('Buddy request not found');
    }
    return req;
  }
}
