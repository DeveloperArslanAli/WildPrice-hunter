import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SearchInputType, SearchSessionStatus } from '@wildprice/shared-types';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('search_sessions')
export class SearchSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.searchSessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'input_type', type: 'enum', enum: SearchInputType })
  inputType: SearchInputType;

  @Column({ name: 'input_value', type: 'text' })
  inputValue: string;

  @Column({
    type: 'enum',
    enum: SearchSessionStatus,
    default: SearchSessionStatus.PENDING,
  })
  status: SearchSessionStatus;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'original_product_id' })
  originalProduct?: Product;

  @Column({ name: 'original_product_id', nullable: true })
  originalProductId?: string;

  @Column({ name: 'original_listing_id', nullable: true })
  originalListingId?: string;

  @Column({ name: 'result_count', default: 0 })
  resultCount: number;

  @Column({ name: 'result_listing_ids', type: 'jsonb', default: [] })
  resultListingIds: string[];

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}
