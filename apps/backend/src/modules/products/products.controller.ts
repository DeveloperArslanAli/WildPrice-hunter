import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { SentimentService } from './sentiment.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private sentimentService: SentimentService,
  ) {}

  @Get(':id/sentiment')
  @ApiOperation({ summary: 'Get AI customer review sentiment and fake review risk audit' })
  async getSentiment(@Param('id') id: string) {
    const report = await this.sentimentService.getOrAnalyzeSentiment(id);
    return { success: true, data: report };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details with all platform listings' })
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return { success: true, data: product };
  }

  @Get(':id/dropshipping')
  @ApiOperation({ summary: 'Get dropshipping profit analysis for a product' })
  async getDropshipping(@Param('id') id: string) {
    const analysis = await this.productsService.getDropshippingAnalysis(id);
    return { success: true, data: analysis };
  }

  @Get('listing/:listingId/history')
  @ApiOperation({ summary: 'Get price history for a specific listing' })
  async getPriceHistory(@Param('listingId') listingId: string) {
    const history = await this.productsService.getPriceHistory(listingId);
    return { success: true, data: history };
  }
}
