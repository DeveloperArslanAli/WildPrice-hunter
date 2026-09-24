const axios = require('axios');

async function testPublicScraping() {
  console.log('Testing live scrapers...');

  // 1. Test Amazon live via Rainforest
  try {
    const rainRes = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY || 'your_rainforest_api_key_here',
        type: 'search',
        search_term: 'ASUS laptop',
        amazon_domain: 'amazon.com'
      },
      timeout: 10000
    });
    console.log('Amazon live search items:', rainRes.data.search_results?.length);
    if (rainRes.data.search_results?.[0]) {
      console.log('Amazon Item 1:', rainRes.data.search_results[0].title, '$' + rainRes.data.search_results[0].price?.value);
    }
  } catch(e) {
    console.log('Amazon error:', e.message);
  }

  // 2. Test eBay item metadata extraction from URL parameters or open query
  const testEbayUrl = 'https://www.ebay.com/itm/317691904571?_trkparms=...&brand=ASUS...';
  // Notice URL params: brand=ASUS, itm=317691904571
  const parsedUrl = new URL(testEbayUrl.split('?')[0]);
  console.log('Parsed eBay pathname:', parsedUrl.pathname);
}

testPublicScraping();
