import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BeanRatingsService } from './bean-ratings.service';
import { CreateBeanRatingDto } from './dto/create-bean-rating.dto';
import { UpdateBeanRatingDto } from './dto/update-bean-rating.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('bean-ratings')
export class BeanRatingsController {
  constructor(private readonly beanRatingsService: BeanRatingsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.beanRatingsService.findAllForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBeanRatingDto,
  ) {
    return this.beanRatingsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBeanRatingDto,
  ) {
    return this.beanRatingsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.beanRatingsService.remove(user.id, id);
  }
}
