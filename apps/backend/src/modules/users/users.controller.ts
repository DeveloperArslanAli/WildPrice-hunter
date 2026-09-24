import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Request } from 'express';

class UpdateProfileDto {
  @IsString() @IsOptional() displayName?: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsBoolean() @IsOptional() dropshippingMode?: boolean;
  @IsString() @IsOptional() fcmToken?: string;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: Request & { user: { id: string } }) {
    const user = await this.usersService.findById(req.user.id);
    return { success: true, data: user };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  async updateMe(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(req.user.id, dto);
    return { success: true, data: user };
  }
}
