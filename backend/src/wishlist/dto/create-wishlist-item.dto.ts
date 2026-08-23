import { IsUUID } from 'class-validator';

export class CreateWishlistItemDto {
  @IsUUID()
  coffeeShopId: string;
}
