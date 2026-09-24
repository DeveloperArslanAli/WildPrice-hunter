import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { SearchSession } from '../../search/entities/search-session.entity';
import { WatchlistItem } from '../../watchlist/entities/watchlist-item.entity';
import { SearchHistory } from '../../history/entities/search-history.entity';

export enum UserPlan {
  FREE = 'free',
  PRO = 'pro',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column({ name: 'dropshipping_mode', default: false })
  dropshippingMode: boolean;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken?: string;

  @Column({ name: 'daily_search_count', default: 0 })
  dailySearchCount: number;

  @Column({ name: 'daily_search_reset_at', type: 'timestamp', nullable: true })
  dailySearchResetAt?: Date;

  @Column({ name: 'refresh_token', nullable: true })
  @Exclude()
  refreshToken?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => SearchSession, (s) => s.user)
  searchSessions: SearchSession[];

  @OneToMany(() => WatchlistItem, (w) => w.user)
  watchlistItems: WatchlistItem[];

  @OneToMany(() => SearchHistory, (h) => h.user)
  searchHistory: SearchHistory[];

  @BeforeInsert()
  async hashPassword() {
    if (this.passwordHash) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}
