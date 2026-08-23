import { IsUUID } from 'class-validator';

export class SendBuddyRequestDto {
  @IsUUID()
  addresseeId: string;
}
