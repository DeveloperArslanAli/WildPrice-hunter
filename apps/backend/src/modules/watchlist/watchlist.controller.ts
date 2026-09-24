import {
  Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WatchlistService, CreateWatchlistDto } from './watchlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { IsNumber } from 'class-validator';

class UpdateTargetPriceDto {
  @IsNumber() targetPrice: number;
}

@ApiTags('watchlist')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get all watchlist items for current user' })
  async findAll(@Req() req: Request & { user: { id: string } }) {
    const items = await this.watchlistService.findAll(req.user.id);
    return { success: true, data: items };
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to watchlist with target price' })
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateWatchlistDto,
  ) {
    const item = await this.watchlistService.create(req.user.id, dto);
    return { success: true, data: item };
  }

  @Patch(':id/target-price')
  @ApiOperation({ summary: 'Update target price for watchlist alert' })
  async updatePrice(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateTargetPriceDto,
  ) {
    const item = await this.watchlistService.updateTargetPrice(id, req.user.id, dto.targetPrice);
    return { success: true, data: item };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a watchlist item' })
  async remove(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    await this.watchlistService.remove(id, req.user.id);
    return { success: true, message: 'Removed from watchlist' };
  }
}
