import { UrlParser } from '../services/urlParser';
import { Platform } from '@wildprice/shared-types';

describe('UrlParser (Embedded Service)', () => {
  describe('Amazon URL Parsing', () => {
    it('should parse standard /dp/ ASIN format', () => {
      const result = UrlParser.parse('https://www.amazon.com/dp/B08N5WRWNW');
      expect(result.platform).toBe(Platform.AMAZON);
      expect(result.productId).toBe('B08N5WRWNW');
      expect(result.canonicalUrl).toBe('https://www.amazon.com/dp/B08N5WRWNW');
    });

    it('should parse /gp/product/ ASIN format', () => {
      const result = UrlParser.parse('https://www.amazon.com/gp/product/B07XJ8C8F5?ref=ppx_pt2_dt_b_prod_image');
      expect(result.platform).toBe(Platform.AMAZON);
      expect(result.productId).toBe('B07XJ8C8F5');
    });

    it('should parse international Amazon domains (amazon.co.uk, amazon.de)', () => {
      const ukResult = UrlParser.parse('https://www.amazon.co.uk/dp/B09G9FPHY6');
      expect(ukResult.platform).toBe(Platform.AMAZON);
      expect(ukResult.productId).toBe('B09G9FPHY6');

      const deResult = UrlParser.parse('https://www.amazon.de/dp/B09G9FPHY6');
      expect(deResult.platform).toBe(Platform.AMAZON);
      expect(deResult.productId).toBe('B09G9FPHY6');
    });

    it('should handle naked Amazon URLs without protocol', () => {
      const result = UrlParser.parse('amazon.com/dp/B08N5WRWNW');
      expect(result.platform).toBe(Platform.AMAZON);
      expect(result.productId).toBe('B08N5WRWNW');
    });
  });

  describe('eBay URL Parsing', () => {
    it('should parse standard eBay item URL', () => {
      const result = UrlParser.parse('https://www.ebay.com/itm/123456789012');
      expect(result.platform).toBe(Platform.EBAY);
      expect(result.productId).toBe('123456789012');
      expect(result.canonicalUrl).toBe('https://www.ebay.com/itm/123456789012');
    });

    it('should parse eBay item URL with slug', () => {
      const result = UrlParser.parse('https://www.ebay.com/itm/Sony-WH-1000XM5-Wireless-Headphones/334567890123');
      expect(result.platform).toBe(Platform.EBAY);
      expect(result.productId).toBe('334567890123');
    });
  });

  describe('AliExpress URL Parsing', () => {
    it('should parse AliExpress item URL with .html', () => {
      const result = UrlParser.parse('https://www.aliexpress.com/item/1005006123456789.html');
      expect(result.platform).toBe(Platform.ALIEXPRESS);
      expect(result.productId).toBe('1005006123456789');
    });

    it('should parse AliExpress item URL without .html', () => {
      const result = UrlParser.parse('https://www.aliexpress.com/item/1005006123456789');
      expect(result.platform).toBe(Platform.ALIEXPRESS);
      expect(result.productId).toBe('1005006123456789');
    });
  });

  describe('Walmart URL Parsing', () => {
    it('should parse Walmart product URL', () => {
      const result = UrlParser.parse('https://www.walmart.com/ip/Apple-AirPods-Pro-2nd-Generation/189734567');
      expect(result.platform).toBe(Platform.WALMART);
      expect(result.productId).toBe('189734567');
    });
  });

  describe('Etsy & Shopify URL Parsing', () => {
    it('should parse Etsy listing URL', () => {
      const result = UrlParser.parse('https://www.etsy.com/listing/987654321/handmade-leather-wallet');
      expect(result.platform).toBe(Platform.ETSY);
      expect(result.productId).toBe('987654321');
    });

    it('should parse Shopify store product URL', () => {
      const result = UrlParser.parse('https://coolbrand.myshopify.com/products/wireless-earbuds-pro');
      expect(result.platform).toBe(Platform.SHOPIFY);
      expect(result.keywords).toContain('wireless earbuds pro');
    });
  });

  describe('Edge Cases and Fallbacks', () => {
    it('should handle unknown domains gracefully', () => {
      const result = UrlParser.parse('https://www.target.com/p/nintendo-switch/-/A-82684805');
      expect(result.platform).toBe(Platform.UNKNOWN);
      expect(result.canonicalUrl).toBe('https://www.target.com/p/nintendo-switch/-/A-82684805');
    });

    it('should handle malformed strings without throwing errors', () => {
      const result = UrlParser.parse('not-a-valid-url-at-all');
      expect(result.platform).toBe(Platform.UNKNOWN);
      expect(result.canonicalUrl).toBeDefined();
    });

    it('should handle empty input', () => {
      const result = UrlParser.parse('');
      expect(result.platform).toBe(Platform.UNKNOWN);
    });
  });
});
