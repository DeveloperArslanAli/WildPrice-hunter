const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.FIRECRAWL_API_KEY;
const rawUrl = process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev';
const apiUrl = rawUrl.replace(/\/+$/, '').endsWith('/v1') ? rawUrl.replace(/\/+$/, '') : `${rawUrl.replace(/\/+$/, '')}/v1`;

if (!apiKey || apiKey.includes('your_firecrawl')) {
  console.error('ERROR: No valid FIRECRAWL_API_KEY found in .env');
  process.exit(1);
}

const ProductExtractSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'The official product title' },
    price: { type: 'number', description: 'The current purchase price as a clean decimal number' },
    currency: { type: 'string', description: 'Three-letter ISO currency code', default: 'USD' },
    imageUrl: { type: 'string', description: 'Direct image URL' },
    inStock: { type: 'boolean', description: 'Whether item is in stock', default: true },
  },
  required: ['title', 'price'],
};

const PLATFORMS = [
  { platform: 'amazon', domain: 'amazon.com', label: 'Amazon' },
  { platform: 'ebay', domain: 'ebay.com/itm/', label: 'eBay' },
  { platform: 'aliexpress', domain: 'aliexpress.com', label: 'AliExpress' },
  { platform: 'walmart', domain: 'walmart.com', label: 'Walmart' },
];

function extractPriceFromText(text) {
  if (!text) return 0;
  const m1 = text.match(/(?:US\s*)?\$([0-9]{1,5}(?:\.[0-9]{2})?)/i);
  if (m1) return parseFloat(m1[1]);
  const m2 = text.match(/([0-9]{1,5}(?:\.[0-9]{2})?)\s*USD/i);
  if (m2) return parseFloat(m2[1]);
  return 0;
}

async function searchPlatformLive(platformInfo, query) {
  const startTime = Date.now();
  console.log(`[INITIATE] Live Firecrawl search on ${platformInfo.label} for "${query}"...`);

  try {
    const res = await axios.post(
      `${apiUrl}/search`,
      {
        query: `${query} site:${platformInfo.domain}`,
        limit: 2,
        scrapeOptions: {
          formats: ['json'],
          jsonOptions: {
            schema: ProductExtractSchema,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 35000,
      }
    );

    const elapsed = Date.now() - startTime;
    const items = res.data?.data || [];
    console.log(`[SUCCESS] ${platformInfo.label}: Received ${items.length} raw listings in ${elapsed}ms`);

    const listings = [];
    for (const item of items) {
      const json = item.json;
      const title = json?.title || item.title || item.metadata?.title;
      const url = item.url || item.metadata?.sourceURL || '';

      if (!title || !url) continue;

      let price = json?.price;
      let priceSource = 'Firecrawl Schema';

      if (typeof price !== 'number' || isNaN(price) || price <= 0) {
        const textToScan = `${title} ${item.description || ''} ${item.markdown || ''}`;
        price = extractPriceFromText(textToScan);
        priceSource = price > 0 ? 'Regex Scrape' : 'Unavailable';
      }

      listings.push({
        platform: platformInfo.platform,
        label: platformInfo.label,
        title: title.trim(),
        price: price > 0 ? price : 0,
        currency: json?.currency || 'USD',
        url,
        imageUrl: json?.imageUrl || item.metadata?.ogImage || null,
        inStock: json?.inStock ?? true,
        priceSource,
      });
    }

    return listings;
  } catch (err) {
    console.error(`[ERROR] ${platformInfo.label} failed:`, err.response?.data?.error || err.message);
    return [];
  }
}

async function runLiveMultiPlatformAudit() {
  const QUERY = 'Casio F91W Digital Watch';

  console.log('================================================================================');
  console.log(`  LIVE 4-PLATFORM PRODUCT SEARCH ENGINE AUDIT`);
  console.log(`  Query: "${QUERY}"`);
  console.log(`  Engine: Firecrawl Structured LLM + Schema Extraction (Zero Hardcoded Data)`);
  console.log(`  Targets: Amazon | eBay | AliExpress | Walmart`);
  console.log('================================================================================\n');

  const overallStart = Date.now();

  // Run all 4 platform scrapers in parallel
  const settled = await Promise.allSettled(
    PLATFORMS.map((p) => searchPlatformLive(p, QUERY))
  );

  const allListings = [];
  settled.forEach((res) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      allListings.push(...res.value);
    }
  });

  const totalTime = Date.now() - overallStart;

  console.log('\n================================================================================');
  console.log(`  VERIFICATION RESULTS: Discovered ${allListings.length} Live Platform Listings (${totalTime}ms)`);
  console.log('================================================================================\n');

  // Display details for each platform
  PLATFORMS.forEach((p) => {
    const platformListings = allListings.filter((l) => l.platform === p.platform);
    console.log(`▶ Platform: [${p.label.toUpperCase()}] (${platformListings.length} found)`);
    if (platformListings.length === 0) {
      console.log(`   (No listings returned)`);
    } else {
      platformListings.forEach((item, idx) => {
        console.log(`   #${idx + 1} Title:  ${item.title.substring(0, 75)}...`);
        console.log(`      Price:  $${item.price.toFixed(2)} ${item.currency} [Source: ${item.priceSource}]`);
        console.log(`      InStock: ${item.inStock}`);
        console.log(`      Image:  ${item.imageUrl ? item.imageUrl.substring(0, 60) + '...' : 'N/A'}`);
        console.log(`      URL:    ${item.url}`);
      });
    }
    console.log('');
  });

  // Calculate live price comparison matrix
  const pricedListings = allListings.filter((l) => l.price > 0);
  pricedListings.sort((a, b) => a.price - b.price);

  console.log('================================================================================');
  console.log('  LIVE PRICE COMPARISON MATRIX (Lowest Price to Highest Price)');
  console.log('================================================================================');

  pricedListings.forEach((item, idx) => {
    const rank = `#${idx + 1}`.padEnd(4);
    const platform = `[${item.label}]`.padEnd(14);
    const priceStr = `$${item.price.toFixed(2)}`.padStart(8);
    const title = item.title.length > 50 ? item.title.substring(0, 47) + '...' : item.title;
    console.log(`  ${rank} ${platform} ${priceStr} | ${title}`);
  });

  if (pricedListings.length >= 2) {
    const cheapest = pricedListings[0];
    const mostExpensive = pricedListings[pricedListings.length - 1];
    const savings = mostExpensive.price - cheapest.price;
    const savingsPercent = Math.round((savings / mostExpensive.price) * 100);

    console.log('\n--------------------------------------------------------------------------------');
    console.log(`  CHEAPEST PLATFORM:    ${cheapest.label} at $${cheapest.price.toFixed(2)}`);
    console.log(`  HIGHEST PLATFORM:     ${mostExpensive.label} at $${mostExpensive.price.toFixed(2)}`);
    console.log(`  REAL-TIME SAVINGS:    $${savings.toFixed(2)} (${savingsPercent}% saved for user!)`);
    console.log('--------------------------------------------------------------------------------\n');
  }

  // Verify all 4 platforms returned results
  const platformsFound = new Set(allListings.map((l) => l.platform));
  const missingPlatforms = PLATFORMS.filter((p) => !platformsFound.has(p.platform));

  if (missingPlatforms.length === 0) {
    console.log('✓ 100% COVERAGE: All 4 platforms returned genuine live products with zero mock data!');
  } else {
    console.log(`⚠ Partial coverage: Missing platforms: ${missingPlatforms.map((p) => p.label).join(', ')}`);
  }
}

runLiveMultiPlatformAudit().catch(console.error);
