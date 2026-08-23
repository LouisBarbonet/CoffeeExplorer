import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BeanBagsService } from './bean-bags.service';
import { CreateBeanBagDto } from './dto/create-bean-bag.dto';

@Controller('bean-bags')
export class BeanBagsController {
  constructor(private readonly beanBagsService: BeanBagsService) {}

  @Get()
  findAll() {
    return this.beanBagsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.beanBagsService.findById(id);
  }

  @Post()
  create(@Body() createBeanBagDto: CreateBeanBagDto) {
    return this.beanBagsService.create(createBeanBagDto);
  }
}
