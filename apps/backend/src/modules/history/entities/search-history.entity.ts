import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SearchSession } from '../../search/entities/search-session.entity';

@Entity('search_history')
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.searchHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => SearchSession, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SearchSession;

  @Column({ name: 'session_id' })
  sessionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
