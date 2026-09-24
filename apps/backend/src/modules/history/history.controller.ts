import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('history')
@Controller('history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get user search history' })
  async findAll(@Req() req: Request & { user: { id: string } }) {
    const items = await this.historyService.findAll(req.user.id);
    return { success: true, data: items };
  }

  @Delete('all')
  @ApiOperation({ summary: 'Clear all search history' })
  async clearAll(@Req() req: Request & { user: { id: string } }) {
    await this.historyService.clearAll(req.user.id);
    return { success: true, message: 'History cleared' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific history item' })
  async remove(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    await this.historyService.remove(id, req.user.id);
    return { success: true, message: 'History item deleted' };
  }
}
