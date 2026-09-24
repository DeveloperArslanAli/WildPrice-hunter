import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SearchModule } from './modules/search/search.module';
import { ProductsModule } from './modules/products/products.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { HistoryModule } from './modules/history/history.module';
import { AiModule } from './modules/ai/ai.module';
import { TrustModule } from './modules/trust/trust.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // ─── Configuration ─────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ─── Database ───────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // ─── Redis / BullMQ ────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
    }),

    // ─── Rate Limiting ─────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 30),
        },
      ],
    }),

    // ─── Health checks ─────────────────────────────────────
    TerminusModule,
    HttpModule,

    // ─── Feature Modules ───────────────────────────────────
    AuthModule,
    UsersModule,
    SearchModule,
    ProductsModule,
    ScraperModule,
    WatchlistModule,
    HistoryModule,
    AiModule,
    TrustModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
