import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoffeeShopsService } from './coffee-shops.service';
import { CreateCoffeeShopDto } from './dto/create-coffee-shop.dto';

@Controller('coffee-shops')
export class CoffeeShopsController {
  constructor(private readonly coffeeShopsService: CoffeeShopsService) {}

  @Get()
  findAll() {
    return this.coffeeShopsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coffeeShopsService.findById(id);
  }

  @Post()
  create(@Body() createCoffeeShopDto: CreateCoffeeShopDto) {
    return this.coffeeShopsService.create(createCoffeeShopDto);
  }
}
