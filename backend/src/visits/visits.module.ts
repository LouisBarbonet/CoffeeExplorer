import { Module } from '@nestjs/common';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { CoffeeShopsModule } from '../coffee_shops/coffee-shops.module';

@Module({
  imports: [CoffeeShopsModule],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
