const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.FIRECRAWL_API_KEY;

const ProductExtractSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Product title' },
    price: { type: 'number', description: 'Price in USD' },
    rating: { type: 'number', description: 'Rating out of 5' },
    reviewCount: { type: 'number', description: 'Review count' },
    inStock: { type: 'boolean', description: 'In stock availability' },
    sellerName: { type: 'string', description: 'Seller name' },
  },
  required: ['title'],
};

async function testLiveProductScrape() {
  const url = 'https://www.amazon.com/Casio-F91W-1-Classic-Resin-Digital/dp/B000GAWSDG';
  console.log(`Testing live scrape on Amazon URL: ${url}`);

  try {
    const res = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url,
        formats: ['json'],
        jsonOptions: {
          schema: ProductExtractSchema,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('Live Scrape Status:', res.status);
    console.log('Live Scrape Success:', res.data?.success);
    console.log('Live Extracted Data:');
    console.dir(res.data?.data?.json);
  } catch (err) {
    console.log('Live scrape error:', err.response?.status, err.response?.data || err.message);
  }
}

testLiveProductScrape();
