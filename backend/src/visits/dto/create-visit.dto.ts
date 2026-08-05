import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateCoffeeShopDto } from '../../coffee_shops/dto/create-coffee-shop.dto';

export class CreateVisitDto {
  @IsOptional()
  @IsUUID()
  coffeeShopId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCoffeeShopDto)
  newCoffeeShop?: CreateCoffeeShopDto;

  @IsOptional()
  @IsISO8601()
  visitedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
