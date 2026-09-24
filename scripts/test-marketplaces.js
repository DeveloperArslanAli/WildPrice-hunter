const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.FIRECRAWL_API_KEY;

async function testMarketplaceSearches() {
  console.log('Testing live marketplace searches with Firecrawl...\n');

  const platforms = [
    { name: 'Amazon', domain: 'amazon.com', query: 'Casio F91W Watch site:amazon.com' },
    { name: 'eBay', domain: 'ebay.com', query: 'Casio F91W Watch site:ebay.com' },
    { name: 'AliExpress', domain: 'aliexpress.com', query: 'Casio F91W Watch site:aliexpress.com' },
    { name: 'Walmart', domain: 'walmart.com', query: 'Casio F91W Watch site:walmart.com' },
  ];

  for (const p of platforms) {
    try {
      console.log(`Searching ${p.name}...`);
      const res = await axios.post(
        'https://api.firecrawl.dev/v1/search',
        {
          query: p.query,
          limit: 3,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      console.log(`✓ ${p.name} results:`, res.data?.data?.length);
      if (res.data?.data?.[0]) {
        console.log(`   [1] Title: ${res.data.data[0].title}`);
        console.log(`       URL:   ${res.data.data[0].url}`);
        console.log(`       Desc:  ${res.data.data[0].description?.substring(0, 80)}...`);
      }
    } catch (err) {
      console.log(`✗ ${p.name} error:`, err.response?.status, err.response?.data || err.message);
    }
  }
}

testMarketplaceSearches();
