import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { CoffeeShopsModule } from './coffee_shops/coffee-shops.module';
import { VisitsModule } from './visits/visits.module';
import { PhotosModule } from './photos/photos.module';
import { BuddiesModule } from './buddies/buddies.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { BeanBagsModule } from './bean_bags/bean-bags.module';
import { BeanRatingsModule } from './bean_ratings/bean-ratings.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoffeeShopsModule,
    VisitsModule,
    PhotosModule,
    BuddiesModule,
    WishlistModule,
    BeanBagsModule,
    BeanRatingsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
