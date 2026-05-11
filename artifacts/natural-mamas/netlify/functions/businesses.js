// businesses.js — JSON API used by the static index.html for client-side filtering
// Lives at: netlify/functions/businesses.js
// Returns: { businesses: [...] }

const { fetchBusinesses } = require('./_helpers');

exports.handler = async () => {
  try {
    const businesses = await fetchBusinesses();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ businesses })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};