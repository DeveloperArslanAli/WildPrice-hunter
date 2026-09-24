import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, PlatformListing, PriceHistory } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(PlatformListing)
    private listingsRepo: Repository<PlatformListing>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepo: Repository<PriceHistory>,
  ) {}

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: { listings: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getPriceHistory(listingId: string): Promise<PriceHistory[]> {
    return this.priceHistoryRepo.find({
      where: { listingId },
      order: { scrapedAt: 'ASC' },
      take: 90, // Last 90 data points
    });
  }

  async getDropshippingAnalysis(productId: string) {
    const listings = await this.listingsRepo.find({
      where: { productId },
      order: { price: 'ASC' },
    });

    const sourcingListing = listings.find(
      (l) => l.platform === 'aliexpress',
    );
    const retailListing = listings.find(
      (l) => l.platform === 'amazon' || l.platform === 'ebay',
    );

    if (!sourcingListing || !retailListing) return null;

    const profitMargin = Number(retailListing.totalCost) - Number(sourcingListing.totalCost);
    const profitMarginPercent = Math.round(
      (profitMargin / Number(retailListing.totalCost)) * 100,
    );

    return {
      sourcingListing,
      retailListing,
      profitMargin: Math.max(0, profitMargin),
      profitMarginPercent: Math.max(0, profitMarginPercent),
      nicheOpportunityScore: Math.min(100, profitMarginPercent + (retailListing.reviewCount ? Math.log10(retailListing.reviewCount) * 10 : 0)),
    };
  }
}
