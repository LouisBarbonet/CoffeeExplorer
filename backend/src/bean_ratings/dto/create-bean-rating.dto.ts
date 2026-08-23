import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateBeanBagDto } from '../../bean_bags/dto/create-bean-bag.dto';

export class CreateBeanRatingDto {
  @IsOptional()
  @IsUUID()
  beanBagId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBeanBagDto)
  newBeanBag?: CreateBeanBagDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
