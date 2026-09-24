import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthTokens } from '@wildprice/shared-types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash: dto.password, // Will be hashed by @BeforeInsert
      displayName: dto.displayName,
    });
    await this.usersRepo.save(user);

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await user.validatePassword(dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Session expired');
    }

    const validRefresh = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!validRefresh) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepo.update(userId, { refreshToken: undefined });
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, plan: user.plan };

    const accessExpiry = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '900');
    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '604800');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: parseInt(accessExpiry, 10) || 900,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: parseInt(refreshExpiry, 10) || 604800,
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 }; // 15min in seconds
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const hashed = await bcrypt.hash(token, 10);
    await this.usersRepo.update(userId, { refreshToken: hashed });
  }
}
