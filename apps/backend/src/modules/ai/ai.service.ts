import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProductFingerprint } from '@wildprice/shared-types';

export interface ReviewSentiment {
  positive: string[];
  negative: string[];
  summary: string;
  overallSentiment: 'positive' | 'neutral' | 'negative';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;

  constructor(private config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY', ''));
    const modelName = config.get<string>('GEMINI_MODEL', 'gemini-3.6-flash');
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Extracts a normalized product fingerprint from raw product data.
   * Used to match similar products across platforms.
   */
  async extractProductFingerprint(productData: {
    title: string;
    description?: string;
    brand?: string;
    category?: string;
    images?: string[];
  }): Promise<ProductFingerprint> {
    const prompt = `You are a product intelligence system. Extract a normalized product fingerprint from this data.
    
Product Title: ${productData.title}
Brand: ${productData.brand || 'Unknown'}
Category: ${productData.category || 'Unknown'}
Description: ${productData.description?.slice(0, 500) || 'N/A'}

Return a JSON object with this exact structure:
{
  "canonicalTitle": "clean, normalized product title without brand/marketing fluff",
  "brand": "brand name or null",
  "category": "Category > Subcategory format",
  "keyAttributes": ["array", "of", "key", "product", "attributes"],
  "modelNumber": "model number if found, else null",
  "similarityThreshold": 0.80
}

Focus on: type, key specs, model number, color/variant. Ignore marketing words.
Return ONLY valid JSON, no markdown.`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      const json = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(json) as ProductFingerprint;
    } catch (error) {
      this.logger.warn(`Fingerprint extraction failed: ${error}`);
      // Fallback fingerprint
      return {
        canonicalTitle: productData.title,
        brand: productData.brand,
        category: productData.category,
        keyAttributes: [],
        similarityThreshold: 0.7,
      };
    }
  }

  /**
   * Calculates similarity score between a target fingerprint and a candidate product title.
   * Returns 0-1 where 1 is identical.
   */
  async calculateSimilarity(
    fingerprint: ProductFingerprint,
    candidateTitle: string,
  ): Promise<number> {
    const prompt = `You are a product matching expert. Score how similar these two products are on a scale of 0 to 1.

Original Product:
- Title: ${fingerprint.canonicalTitle}
- Brand: ${fingerprint.brand || 'Unknown'}
- Category: ${fingerprint.category || 'Unknown'}
- Key Attributes: ${fingerprint.keyAttributes.join(', ')}
- Model: ${fingerprint.modelNumber || 'N/A'}

Candidate Product Title: "${candidateTitle}"

Scoring guide:
- 1.0 = Exact same product (same model, brand, specs)
- 0.8-0.9 = Very similar (same model, minor variant difference)
- 0.6-0.7 = Similar but different variant (color, size, generation)
- 0.4-0.5 = Same category but different product
- 0.0-0.3 = Unrelated

Return ONLY a single decimal number between 0 and 1. No other text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const score = parseFloat(result.response.text().trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch {
      return 0.5;
    }
  }

  /**
   * Generates a compact, cross-platform search query from a product fingerprint.
   * Designed for use with eBay, AliExpress, and Walmart search APIs which respond
   * best to short, precise queries (3-6 words) rather than verbose product titles.
   *
   * Example:
   *   fingerprint.canonicalTitle = "Casio Men's F91W-1 Classic Digital Watch"
   *   → returns "Casio F91W Digital Watch"
   */
  async buildSearchKeywords(fingerprint: {
    canonicalTitle: string;
    brand?: string | null;
    modelNumber?: string | null;
    keyAttributes?: string[];
    category?: string | null;
  }): Promise<string> {
    const prompt = `You are a product search query optimizer. Generate the shortest possible search query that would find this exact product on eBay, AliExpress, and Walmart.

Product:
- Canonical Title: ${fingerprint.canonicalTitle}
- Brand: ${fingerprint.brand || 'Unknown'}
- Model Number: ${fingerprint.modelNumber || 'N/A'}
- Key Attributes: ${fingerprint.keyAttributes?.slice(0, 5).join(', ') || 'N/A'}
- Category: ${fingerprint.category || 'N/A'}

Rules:
1. Return ONLY 3 to 6 words maximum
2. Always include brand if known
3. Always include model number if known
4. Skip marketing words: "premium", "original", "quality", "best", "new", etc.
5. Skip generic words: "men's", "women's", "for", "with", "pack", etc.
6. Return ONLY the search query string, nothing else.

Example output: "Casio F91W Digital Watch"`;

    try {
      const result = await this.model.generateContent(prompt);
      const keywords = result.response.text().trim().replace(/['"]/g, '');
      // Validate: must be 2-8 words
      const wordCount = keywords.split(/\s+/).length;
      if (wordCount >= 2 && wordCount <= 8 && keywords.length > 3) {
        return keywords;
      }
      // Fallback: use canonicalTitle trimmed to 5 words
      return fingerprint.canonicalTitle.split(' ').slice(0, 5).join(' ');
    } catch (err) {
      this.logger.warn(`buildSearchKeywords failed: ${err}`);
      // Fallback: brand + model or first 4 words of canonical title
      if (fingerprint.brand && fingerprint.modelNumber) {
        return `${fingerprint.brand} ${fingerprint.modelNumber}`;
      }
      return fingerprint.canonicalTitle.split(' ').slice(0, 4).join(' ');
    }
  }

  /**
   * Analyzes product reviews and returns sentiment summary.
   */
  async analyzeReviewSentiment(reviews: string[]): Promise<ReviewSentiment> {
    if (!reviews.length) {
      return {
        positive: [],
        negative: [],
        summary: 'No reviews available',
        overallSentiment: 'neutral',
      };
    }

    const prompt = `Analyze these product reviews and provide a sentiment summary.

Reviews:
${reviews.slice(0, 20).map((r, i) => `${i + 1}. ${r}`).join('\n')}

Return a JSON object:
{
  "positive": ["top 3 positive points mentioned by customers"],
  "negative": ["top 3 negative points mentioned by customers"],
  "summary": "One sentence overall summary",
  "overallSentiment": "positive|neutral|negative"
}

Return ONLY valid JSON, no markdown.`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      const json = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(json) as ReviewSentiment;
    } catch {
      return {
        positive: [],
        negative: [],
        summary: 'Could not analyze reviews',
        overallSentiment: 'neutral',
      };
    }
  }

  /**
   * Extracts product keywords from an image URL using Gemini Vision.
   */
  async extractKeywordsFromImage(imageBase64: string): Promise<string> {
    const prompt = `Look at this product image and generate a specific search query to find this exact product online.
Include: product type, brand if visible, key features, color, size estimate.
Return ONLY the search query string, nothing else. Maximum 10 words.`;

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ]);
      return result.response.text().trim();
    } catch (error) {
      this.logger.warn(`Image keyword extraction failed: ${error}`);
      return 'product search';
    }
  }
}
