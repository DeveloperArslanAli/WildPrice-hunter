import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchUrlDto, SearchTextDto, SearchImageDto, SearchResultsQueryDto } from './dto/search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post('url')
  @ApiOperation({ summary: 'Search by product URL (from any platform)' })
  async searchByUrl(
    @Body() dto: SearchUrlDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    const session = await this.searchService.searchByUrl(dto, req.user?.id);
    return { success: true, data: { sessionId: session.id, status: session.status } };
  }

  @Post('text')
  @ApiOperation({ summary: 'Search by product name or keywords' })
  async searchByText(
    @Body() dto: SearchTextDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    const session = await this.searchService.searchByText(dto, req.user?.id);
    return { success: true, data: { sessionId: session.id, status: session.status } };
  }

  @Post('image')
  @ApiOperation({ summary: 'Search by product image (base64 encoded)' })
  async searchByImage(
    @Body() dto: SearchImageDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    const session = await this.searchService.searchByImage(dto, req.user?.id);
    return { success: true, data: { sessionId: session.id, status: session.status } };
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Poll search session status' })
  async getStatus(
    @Param('sessionId') sessionId: string,
    @Req() req: Request & { user?: { id: string } },
  ) {
    const session = await this.searchService.getSessionStatus(sessionId, req.user?.id);
    return {
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        resultCount: session.resultCount,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
      },
    };
  }

  @Get(':sessionId/results')
  @ApiOperation({ summary: 'Get comparison results for a completed search session' })
  async getResults(
    @Param('sessionId') sessionId: string,
    @Query() query: SearchResultsQueryDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    const data = await this.searchService.getSessionResults(sessionId, query, req.user?.id);
    return { success: true, data };
  }
}
