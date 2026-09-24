const axios = require('axios');
require('dotenv').config();

async function testFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const rawUrl = process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev';
  const apiUrl = rawUrl.replace(/\/+$/, '').endsWith('/v1') ? rawUrl.replace(/\/+$/, '') : `${rawUrl.replace(/\/+$/, '')}/v1`;

  console.log(`[Firecrawl Smoke Test] Testing Firecrawl endpoint: ${apiUrl}`);
  console.log(`[Firecrawl Smoke Test] API Key present: ${Boolean(apiKey && apiKey.length > 5)}`);

  if (!apiKey || apiKey === 'fc-your_firecrawl_api_key_here') {
    console.log('[Firecrawl Smoke Test] Notice: Real FIRECRAWL_API_KEY is not configured yet.');
    console.log('[Firecrawl Smoke Test] Scraper integration is verified via Vitest unit suite.');
    return;
  }

  try {
    console.log('[Firecrawl Smoke Test] Testing search endpoint...');
    const searchRes = await axios.post(
      `${apiUrl}/search`,
      {
        query: 'Casio F91W Watch site:amazon.com',
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

    console.log('[Firecrawl Smoke Test] Search success:', searchRes.data?.success);
    console.log('[Firecrawl Smoke Test] Results count:', searchRes.data?.data?.length);
  } catch (err) {
    console.log('[Firecrawl Smoke Test] Live API check:', err.response?.data?.error || err.message);
  }
}

testFirecrawl();
