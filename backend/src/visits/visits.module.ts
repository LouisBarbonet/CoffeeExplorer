import { Module } from '@nestjs/common';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { CoffeeShopsModule } from '../coffee_shops/coffee-shops.module';
import { BuddiesModule } from '../buddies/buddies.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CoffeeShopsModule, BuddiesModule, NotificationsModule],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
