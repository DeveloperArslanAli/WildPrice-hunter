import { IsUrl, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortBy } from '@wildprice/shared-types';

export class SearchUrlDto {
  @ApiProperty({
    example: 'https://www.amazon.com/dp/B08N5WRWNW',
    description: 'Any product URL from any supported platform',
  })
  @IsUrl({ require_tld: true }, { message: 'Must be a valid URL' })
  url: string;
}

export class SearchTextDto {
  @ApiProperty({
    example: 'Sony WH-1000XM5 wireless headphones',
    description: 'Product name or description to search',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  query: string;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class SearchImageDto {
  @ApiProperty({ description: 'Base64-encoded product image' })
  @IsString()
  imageBase64: string;
}

export class SearchResultsQueryDto {
  @ApiPropertyOptional({ enum: SortBy, default: SortBy.PRICE_ASC })
  @IsOptional()
  sortBy?: SortBy;

  @ApiPropertyOptional({ description: 'Max price filter' })
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Min trust score filter (0-100)' })
  @IsOptional()
  minTrust?: number;
}
