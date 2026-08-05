import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateLocationDto } from './create-location.dto';

export class CreateCoffeeShopDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => CreateLocationDto)
  location: CreateLocationDto;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
