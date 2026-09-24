import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, PlatformListing, PriceHistory } from './entities/product.entity';

import { SentimentService } from './sentiment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, PlatformListing, PriceHistory])],
  controllers: [ProductsController],
  providers: [ProductsService, SentimentService],
  exports: [ProductsService, SentimentService],
})
export class ProductsModule {}
