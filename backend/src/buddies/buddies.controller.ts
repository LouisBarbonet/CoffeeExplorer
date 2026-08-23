import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BuddiesService } from './buddies.service';
import { SendBuddyRequestDto } from './dto/send-buddy-request.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('buddies')
export class BuddiesController {
  constructor(private readonly buddiesService: BuddiesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.buddiesService.listBuddies(user.id);
  }

  @Get('requests/incoming')
  incoming(@CurrentUser() user: AuthenticatedUser) {
    return this.buddiesService.listIncoming(user.id);
  }

  @Post('requests')
  sendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendBuddyRequestDto,
  ) {
    return this.buddiesService.sendRequest(user.id, dto.addresseeId);
  }

  @Post('requests/:id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.buddiesService.accept(user.id, id);
  }

  @Post('requests/:id/decline')
  decline(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.buddiesService.decline(user.id, id);
  }

  @Delete(':userId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.buddiesService.removeBuddy(user.id, userId);
  }
}
