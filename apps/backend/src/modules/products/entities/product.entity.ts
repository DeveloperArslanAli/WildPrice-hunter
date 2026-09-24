import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Platform } from '@wildprice/shared-types';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'fingerprint_hash', nullable: true })
  @Index()
  fingerprintHash?: string;

  @Column({ type: 'jsonb', nullable: true })
  fingerprint?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PlatformListing, (l) => l.product)
  listings: PlatformListing[];
}

@Entity('platform_listings')
export class PlatformListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (p) => p.listings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'enum', enum: Platform })
  @Index()
  platform: Platform;

  @Column({ name: 'seller_name', nullable: true })
  sellerName?: string;

  @Column({ name: 'seller_url', nullable: true })
  sellerUrl?: string;

  @Column({ name: 'product_url', type: 'text' })
  productUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column({ name: 'review_count', nullable: true })
  reviewCount?: number;

  @Column({ name: 'in_stock', default: true })
  inStock: boolean;

  @Column({ name: 'trust_score', type: 'smallint', default: 0 })
  trustScore: number;

  @Column({ name: 'trust_breakdown', type: 'jsonb', nullable: true })
  trustBreakdown?: Record<string, number>;

  @Column({ name: 'similarity_score', type: 'decimal', precision: 4, scale: 3, default: 1 })
  similarityScore: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'return_policy', nullable: true })
  returnPolicy?: 'free' | 'paid' | 'none' | 'unknown';

  @Column({ name: 'seller_age_years', type: 'smallint', nullable: true })
  sellerAgeYears?: number;

  @Column({ name: 'has_ssl', nullable: true })
  hasSsl?: boolean;

  @Column({ name: 'last_scraped_at', type: 'timestamp', nullable: true })
  lastScrapedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PriceHistory, (ph) => ph.listing)
  priceHistory: PriceHistory[];
}

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlatformListing, (l) => l.priceHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: PlatformListing;

  @Column({ name: 'listing_id' })
  listingId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: 'scraped_at' })
  scrapedAt: Date;
}
