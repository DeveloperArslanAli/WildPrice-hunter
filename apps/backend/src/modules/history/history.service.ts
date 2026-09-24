import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistory } from './entities/search-history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(SearchHistory)
    private historyRepo: Repository<SearchHistory>,
  ) {}

  async findAll(userId: string): Promise<SearchHistory[]> {
    return this.historyRepo.find({
      where: { userId },
      relations: { session: { originalProduct: true } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async save(userId: string, sessionId: string): Promise<void> {
    const item = this.historyRepo.create({ userId, sessionId });
    await this.historyRepo.save(item);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.historyRepo.delete({ id, userId });
  }

  async clearAll(userId: string): Promise<void> {
    await this.historyRepo.delete({ userId });
  }
}
