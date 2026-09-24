import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { SearchHistory } from './entities/search-history.entity';
import { SearchSession } from '../search/entities/search-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SearchHistory, SearchSession])],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
