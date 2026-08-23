import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistItemDto } from './dto/create-wishlist-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlistService.list(user.id);
  }

  @Post()
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWishlistItemDto,
  ) {
    return this.wishlistService.add(user.id, dto.coffeeShopId);
  }

  @Delete(':coffeeShopId')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('coffeeShopId') coffeeShopId: string,
  ) {
    return this.wishlistService.remove(user.id, coffeeShopId);
  }
}
