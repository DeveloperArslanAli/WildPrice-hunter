import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService (Security & Auth QA Suite)', () => {
  let service: AuthService;
  let mockUsersRepo: any;
  let mockJwtService: any;
  let mockConfig: any;

  beforeEach(() => {
    mockUsersRepo = {
      findOne: vi.fn(),
      create: vi.fn((u) => ({ ...u, id: 'user-uuid-1' })),
      save: vi.fn((u) => Promise.resolve(u)),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mocked.jwt.token'),
      verify: vi.fn(),
    };

    mockConfig = {
      get: vi.fn((key: string, def?: any) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret-123';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret-456';
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '900';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '604800';
        return def;
      }),
    };

    service = new AuthService(
      mockUsersRepo as any,
      mockJwtService as JwtService,
      mockConfig as ConfigService,
    );
  });

  describe('Registration Flow', () => {
    it('should register a new user and return user object with JWT tokens', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await service.register({
        email: 'smartbuyer@wildprice.app',
        password: 'Password123!',
        displayName: 'Smart Buyer',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('smartbuyer@wildprice.app');
      expect(result.tokens.accessToken).toBe('mocked.jwt.token');
      expect(result.tokens.refreshToken).toBe('mocked.jwt.token');
      expect(mockUsersRepo.save).toHaveBeenCalled();
    });

    it('should reject registration if email is already taken', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'existing-id', email: 'taken@wildprice.app' });

      await expect(
        service.register({
          email: 'taken@wildprice.app',
          password: 'Password123!',
          displayName: 'Duplicate User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Login & Credential Authentication', () => {
    it('should login successfully when credentials match', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'smartbuyer@wildprice.app',
        validatePassword: vi.fn().mockResolvedValue(true),
      };

      mockUsersRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'smartbuyer@wildprice.app',
        password: 'Password123!',
      });

      expect(result.user.id).toBe('user-uuid-1');
      expect(result.tokens).toBeDefined();
      expect(mockUser.validatePassword).toHaveBeenCalledWith('Password123!');
    });

    it('should throw UnauthorizedException if user email does not exist', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@wildprice.app', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'smartbuyer@wildprice.app',
        validatePassword: vi.fn().mockResolvedValue(false),
      };

      mockUsersRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'smartbuyer@wildprice.app', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh Token Rotation', () => {
    it('should throw UnauthorizedException if refresh token is invalid or expired', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.refresh({ refreshToken: 'expired.refresh.token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
