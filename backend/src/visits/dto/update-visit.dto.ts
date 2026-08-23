import {
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateVisitDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  visitedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  companionIds?: string[];
}
