import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoastLevel } from '../../../generated/prisma/client.js';

export class CreateBeanBagDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  roaster?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsEnum(RoastLevel)
  roastLevel?: RoastLevel;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
