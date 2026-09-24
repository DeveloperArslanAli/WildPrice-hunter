const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.FIRECRAWL_API_KEY;

async function testEndpoints() {
  console.log('Testing with key:', apiKey.substring(0, 10) + '...');

  // 1. Test scrape endpoint
  console.log('\n--- 1. Testing /v1/scrape ---');
  try {
    const scrapeRes = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: 'https://example.com',
        formats: ['markdown'],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
    console.log('Scrape status:', scrapeRes.status);
    console.log('Scrape success:', scrapeRes.data?.success);
    console.log('Scrape markdown sample:', scrapeRes.data?.data?.markdown?.substring(0, 100));
  } catch (err) {
    console.log('Scrape error:', err.response?.status, err.response?.data || err.message);
  }

  // 2. Test search endpoint v1
  console.log('\n--- 2. Testing /v1/search ---');
  try {
    const searchRes = await axios.post(
      'https://api.firecrawl.dev/v1/search',
      {
        query: 'Casio F91W',
        limit: 2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
    console.log('Search status:', searchRes.status);
    console.log('Search success:', searchRes.data?.success);
    console.log('Search results count:', searchRes.data?.data?.length);
    if (searchRes.data?.data?.[0]) {
      console.log('Result 1 title:', searchRes.data.data[0].title);
      console.log('Result 1 url:', searchRes.data.data[0].url);
    }
  } catch (err) {
    console.log('Search error:', err.response?.status, err.response?.data || err.message);
  }

  // 3. Test scrape with JSON schema
  console.log('\n--- 3. Testing /v1/scrape with JSON schema ---');
  try {
    const scrapeJsonRes = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: 'https://example.com',
        formats: ['json'],
        jsonOptions: {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
            },
            required: ['title'],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
    console.log('Scrape JSON status:', scrapeJsonRes.status);
    console.log('Scrape JSON data:', scrapeJsonRes.data?.data?.json);
  } catch (err) {
    console.log('Scrape JSON error:', err.response?.status, err.response?.data || err.message);
  }
}

testEndpoints();
