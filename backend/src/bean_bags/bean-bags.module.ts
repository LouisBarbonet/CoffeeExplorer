import { Module } from '@nestjs/common';
import { BeanBagsController } from './bean-bags.controller';
import { BeanBagsService } from './bean-bags.service';

@Module({
  controllers: [BeanBagsController],
  providers: [BeanBagsService],
  exports: [BeanBagsService],
})
export class BeanBagsModule {}
