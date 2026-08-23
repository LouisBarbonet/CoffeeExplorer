import { Module } from '@nestjs/common';
import { BeanRatingsController } from './bean-ratings.controller';
import { BeanRatingsService } from './bean-ratings.service';
import { BeanBagsModule } from '../bean_bags/bean-bags.module';
import { BuddiesModule } from '../buddies/buddies.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BeanBagsModule, BuddiesModule, NotificationsModule],
  controllers: [BeanRatingsController],
  providers: [BeanRatingsService],
})
export class BeanRatingsModule {}
