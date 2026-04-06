import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../category/entities/category.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Restaurant, Category, ProductExtra]),
    RestaurantModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, TypeOrmModule],
})
export class ProductModule {}
