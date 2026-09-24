import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ScraperProcessor } from './scraper.processor';
import { AmazonScraper } from './workers/amazon.scraper';
import { EbayScraper } from './workers/ebay.scraper';
import { AliExpressScraper } from './workers/aliexpress.scraper';
import { WalmartScraper } from './workers/walmart.scraper';
import { SearchSession } from '../search/entities/search-session.entity';
import { Product, PlatformListing, PriceHistory } from '../products/entities/product.entity';
import { AiModule } from '../ai/ai.module';
import { TrustModule } from '../trust/trust.module';
import { SCRAPER_QUEUE_NAME } from './scraper.constants';
import { UrlParserService } from '../search/url-parser.service';
import { SearchModule } from '../search/search.module';
import { FirecrawlService } from './firecrawl/firecrawl.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SearchSession, Product, PlatformListing, PriceHistory]),
    BullModule.registerQueue({ name: SCRAPER_QUEUE_NAME }),
    HttpModule,
    AiModule,
    TrustModule,
    forwardRef(() => SearchModule),
  ],
  providers: [
    ScraperProcessor,
    FirecrawlService,
    AmazonScraper,
    EbayScraper,
    AliExpressScraper,
    WalmartScraper,
    UrlParserService,
  ],
  exports: [FirecrawlService, AmazonScraper, EbayScraper, AliExpressScraper, WalmartScraper],
})
export class ScraperModule {}
