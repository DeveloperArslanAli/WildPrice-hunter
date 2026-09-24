import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateWatchlistDto {
  @IsString() productId: string;
  @IsNumber() targetPrice: number;
  @IsString() @IsOptional() currency?: string;
}

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchlistItem)
    private watchlistRepo: Repository<WatchlistItem>,
  ) {}

  async findAll(userId: string): Promise<WatchlistItem[]> {
    return this.watchlistRepo.find({
      where: { userId, isActive: true },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateWatchlistDto): Promise<WatchlistItem> {
    const item = this.watchlistRepo.create({
      userId,
      productId: dto.productId,
      targetPrice: dto.targetPrice,
      currency: dto.currency ?? 'USD',
    });
    return this.watchlistRepo.save(item);
  }

  async updateTargetPrice(id: string, userId: string, targetPrice: number): Promise<WatchlistItem> {
    const item = await this.watchlistRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Watchlist item not found');
    if (item.userId !== userId) throw new ForbiddenException();
    item.targetPrice = targetPrice;
    return this.watchlistRepo.save(item);
  }

  async remove(id: string, userId: string): Promise<void> {
    const item = await this.watchlistRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Watchlist item not found');
    if (item.userId !== userId) throw new ForbiddenException();
    await this.watchlistRepo.remove(item);
  }
}
