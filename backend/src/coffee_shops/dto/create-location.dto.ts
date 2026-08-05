import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
