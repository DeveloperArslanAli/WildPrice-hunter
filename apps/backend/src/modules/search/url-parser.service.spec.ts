import { describe, it, expect } from 'vitest';
import { UrlParserService } from './url-parser.service';
import { Platform } from '@wildprice/shared-types';

describe('UrlParserService (QA Test Suite)', () => {
  const parser = new UrlParserService();

  describe('Amazon URL Parsing', () => {
    it('should parse standard amazon.com /dp/ link', () => {
      const res = parser.parse('https://www.amazon.com/dp/B08N5WRWNW?ref_=ast_sto_dp');
      expect(res.platform).toBe(Platform.AMAZON);
      expect(res.productId).toBe('B08N5WRWNW');
      expect(res.canonicalUrl).toBe('https://www.amazon.com/dp/B08N5WRWNW');
    });

    it('should parse amazon /gp/product/ link', () => {
      const res = parser.parse('https://www.amazon.co.uk/gp/product/B09XYZ1234');
      expect(res.platform).toBe(Platform.AMAZON);
      expect(res.productId).toBe('B09XYZ1234');
    });

    it('should parse amazon URL with product title slug and extract clean keywords', () => {
      const res = parser.parse('https://www.amazon.com/Juicer-Machines-Juilist-Centrifugal-Extractor/dp/B08XYZ1234');
      expect(res.platform).toBe(Platform.AMAZON);
      expect(res.productId).toBe('B08XYZ1234');
      expect(res.keywords).toBe('Juicer Machines Juilist Centrifugal Extractor');
    });

    it('should cleanly strip brand noise, wattages, and marketing fluff from product titles', () => {
      const raw = 'Juicer Machines, Juilist 3" Wide Mouth Centrifugal Juicer, Max 800W, 3-Speed Extractor Juicer for Whole Fruit and Vegetables Cleaning Brush Included BPA Free Stainless Steel';
      const cleaned = parser.cleanProductTitle(raw);
      expect(cleaned.toLowerCase()).toContain('juicer');
      expect(cleaned.toLowerCase()).toContain('machines');
      expect(cleaned.toLowerCase()).toContain('centrifugal');
      expect(cleaned.toLowerCase()).toContain('extractor');
      // Must not contain noise
      expect(cleaned.toLowerCase()).not.toContain('800w');
      expect(cleaned.toLowerCase()).not.toContain('bpa');
      expect(cleaned.toLowerCase()).not.toContain('cleaning');
    });
  });

  describe('eBay URL Parsing', () => {
    it('should parse standard ebay item with slug', () => {
      const res = parser.parse('https://www.ebay.com/itm/Apple-AirPods-Pro-2nd-Gen/123456789012?hash=item1');
      expect(res.platform).toBe(Platform.EBAY);
      expect(res.productId).toBe('123456789012');
      expect(res.canonicalUrl).toBe('https://www.ebay.com/itm/123456789012');
    });

    it('should parse short ebay item path', () => {
      const res = parser.parse('https://www.ebay.com/itm/123456789012');
      expect(res.platform).toBe(Platform.EBAY);
      expect(res.productId).toBe('123456789012');
    });
  });

  describe('AliExpress URL Parsing', () => {
    it('should parse standard aliexpress product link', () => {
      const res = parser.parse('https://www.aliexpress.com/item/1005006123456789.html?spm=a2g0o.home');
      expect(res.platform).toBe(Platform.ALIEXPRESS);
      expect(res.productId).toBe('1005006123456789');
    });
  });

  describe('Walmart URL Parsing', () => {
    it('should parse walmart /ip/ product link', () => {
      const res = parser.parse('https://www.walmart.com/ip/Sony-WH-1000XM5-Wireless-Headphones/987654321');
      expect(res.platform).toBe(Platform.WALMART);
      expect(res.productId).toBe('987654321');
    });
  });

  describe('Shopify & Custom Store Detection', () => {
    it('should detect Shopify product path and extract keyword slug', () => {
      const res = parser.parse('https://gymshark.com/products/oversized-seamless-t-shirt-black');
      expect(res.platform).toBe(Platform.SHOPIFY);
      expect(res.keywords).toBe('oversized seamless t shirt black');
    });

    it('should detect myshopify.com subdomain', () => {
      const res = parser.parse('https://cool-gadgets.myshopify.com/products/laser-pointer-pro');
      expect(res.platform).toBe(Platform.SHOPIFY);
      expect(res.keywords).toBe('laser pointer pro');
    });
  });

  describe('Edge Cases & Malformed Inputs', () => {
    it('should return UNKNOWN platform for unrecognized domain', () => {
      const res = parser.parse('https://random-unknown-shop.xyz/gadget/99');
      expect(res.platform).toBe(Platform.UNKNOWN);
      expect(res.canonicalUrl).toBe('https://random-unknown-shop.xyz/gadget/99');
    });

    it('should not throw on invalid URL string and gracefully return UNKNOWN', () => {
      const res = parser.parse('not-a-valid-url-string');
      expect(res.platform).toBe(Platform.UNKNOWN);
      expect(res.canonicalUrl).toBe('not-a-valid-url-string');
    });
  });
});
