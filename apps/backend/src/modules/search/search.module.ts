import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UrlParserService } from './url-parser.service';
import { SearchSession } from './entities/search-session.entity';
import { Product, PlatformListing } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { AiModule } from '../ai/ai.module';
import { SCRAPER_QUEUE_NAME } from '../scraper/scraper.constants';

import { SearchEventsGateway } from './search.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([SearchSession, Product, PlatformListing, User]),
    BullModule.registerQueue({ name: SCRAPER_QUEUE_NAME }),
    HttpModule,
    AiModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, UrlParserService, SearchEventsGateway],
  exports: [SearchService, UrlParserService, SearchEventsGateway],
})
export class SearchModule {}
