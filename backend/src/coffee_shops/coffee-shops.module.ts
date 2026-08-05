import { Module } from '@nestjs/common';
import { CoffeeShopsController } from './coffee-shops.controller';
import { CoffeeShopsService } from './coffee-shops.service';

@Module({
  controllers: [CoffeeShopsController],
  providers: [CoffeeShopsService],
  exports: [CoffeeShopsService],
})
export class CoffeeShopsModule {}