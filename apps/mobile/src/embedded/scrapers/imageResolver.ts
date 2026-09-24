/**
 * Helper to resolve product image URLs for simulated / fallback scraper listings.
 * Prioritizes original product image when available, and falls back to
 * category-matched images instead of returning generic/mismatched photos.
 */
export function resolveFallbackImage(query: string, originalImageUrl?: string): string {
  if (originalImageUrl && originalImageUrl.trim().length > 0) {
    return originalImageUrl;
  }

  const q = query.toLowerCase();

  // Juicer / Blender / Kitchen appliances
  if (q.includes('juicer') || q.includes('blender') || q.includes('mixer') || q.includes('kitchen') || q.includes('extractor')) {
    return 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&q=80';
  }

  // Watch / Smartwatch
  if (q.includes('watch') || q.includes('chronograph') || q.includes('casio') || q.includes('rolex') || q.includes('seiko')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80';
  }

  // Earbuds / Headphones / Audio
  if (q.includes('earbud') || q.includes('airpod') || q.includes('headphone') || q.includes('headset') || q.includes('earphone')) {
    return 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500&q=80';
  }

  // Phone / Tablet / Mobile
  if (q.includes('phone') || q.includes('iphone') || q.includes('galaxy') || q.includes('pixel') || q.includes('tablet') || q.includes('ipad')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80';
  }

  // Laptop / Computer / Monitor
  if (q.includes('laptop') || q.includes('macbook') || q.includes('computer') || q.includes('pc') || q.includes('monitor')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80';
  }

  // Shoes / Sneakers / Footwear
  if (q.includes('shoe') || q.includes('sneaker') || q.includes('nike') || q.includes('adidas') || q.includes('boot')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80';
  }

  // Generic fallback product image
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
}
