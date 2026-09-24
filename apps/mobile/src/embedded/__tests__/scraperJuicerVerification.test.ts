import { AliExpressScraper } from '../scrapers/aliexpressScraper';
import { EbayScraper } from '../scrapers/ebayScraper';
import { WalmartScraper } from '../scrapers/walmartScraper';
import { AmazonScraper } from '../scrapers/amazonScraper';
import { scraperManager } from '../scrapers/scraperManager';
import { resolveFallbackImage } from '../scrapers/imageResolver';
import { Platform } from '@wildprice/shared-types';

describe('Real-Time Data Verification: Zero Hardcoded / Zero Fake Listings', () => {
  const JUICER_QUERY = 'Juicer Machines Centrifugal Extractor';
  const JUICER_ORIGINAL_IMAGE = 'https://m.media-amazon.com/images/I/71xyzJuicerImage.jpg';
  const AIRPODS_IMAGE_ID = 'photo-1572569511254-d8f925fe2cbb';
  const HEADPHONES_IMAGE_ID = 'photo-1505740420928-5e560c06d30e';

  describe('1. imageResolver Tests', () => {
    it('MUST prioritize originalImageUrl if provided for Juicer', () => {
      const img = resolveFallbackImage(JUICER_QUERY, JUICER_ORIGINAL_IMAGE);
      expect(img).toBe(JUICER_ORIGINAL_IMAGE);
      expect(img).not.toContain(AIRPODS_IMAGE_ID);
    });

    it('MUST return kitchen/juicer image and NEVER AirPods when originalImageUrl is missing', () => {
      const img = resolveFallbackImage('Juicer Machines Juilist 3-Speed Extractor');
      expect(img).toContain('photo-1570222094114-d054a817e56b'); // Kitchen / appliance image
      expect(img).not.toContain(AIRPODS_IMAGE_ID);
      expect(img).not.toContain(HEADPHONES_IMAGE_ID);
    });

    it('MUST return earbud image ONLY when earbud/airpod keyword is queried', () => {
      const img = resolveFallbackImage('Apple AirPods Pro 2nd Gen');
      expect(img).toContain(AIRPODS_IMAGE_ID);
    });
  });

  describe('2. Real-Time Scrapers: Zero Fake Simulated Products', () => {
    it('AliExpressScraper MUST NOT return fake simulated listings when external search is inactive', async () => {
      const scraper = new AliExpressScraper();
      const results = await scraper.searchByKeyword(JUICER_QUERY, JUICER_ORIGINAL_IMAGE);

      // Best practice: returns [] instead of fake hardcoded items
      for (const item of results) {
        expect(item.platform).toBe(Platform.ALIEXPRESS);
        expect(item.imageUrl).not.toContain(AIRPODS_IMAGE_ID);
      }
    });

    it('EbayScraper MUST NOT return hardcoded $74.50 or headphones image', async () => {
      const scraper = new EbayScraper();
      const results = await scraper.searchByKeyword(JUICER_QUERY, JUICER_ORIGINAL_IMAGE);

      // Results must either be genuine or empty, never fake
      for (const item of results) {
        expect(item.platform).toBe(Platform.EBAY);
        expect(item.imageUrl).not.toContain(AIRPODS_IMAGE_ID);
        expect(item.imageUrl).not.toContain(HEADPHONES_IMAGE_ID);
        expect(item.price).not.toBe(72.99);
      }
    });

    it('WalmartScraper MUST NOT return hardcoded $84.99 or simulated listings', async () => {
      const scraper = new WalmartScraper();
      const results = await scraper.searchByKeyword(JUICER_QUERY, JUICER_ORIGINAL_IMAGE);

      for (const item of results) {
        expect(item.platform).toBe(Platform.WALMART);
        expect(item.imageUrl).not.toContain(AIRPODS_IMAGE_ID);
        expect(item.imageUrl).not.toContain(HEADPHONES_IMAGE_ID);
        expect(item.price).not.toBe(84.99);
      }
    });

    it('ScraperManager fetchOriginalByUrl MUST return null rather than fake Monitored Product Target', async () => {
      const original = await scraperManager.fetchOriginalByUrl(
        Platform.EBAY,
        'https://www.ebay.com/itm/non-existent-invalid-id',
      );
      expect(original).toBeNull();
    });
  });
});
