const { fetchBusinesses, slugify } = require('./_helpers');

const SITE = process.env.SITE_URL || 'https://naturalmamawi.com';

const WI_CATEGORIES = [
  'herbal-wellness-wisconsin',
  'raw-honey-wisconsin',
  'natural-skincare-wisconsin',
  'organic-food-wisconsin',
  'natural-candles-wisconsin',
  'natural-baby-products-wisconsin'
];

const WI_REGIONS = [
  'natural-products-milwaukee-wi',
  'natural-products-madison-wi',
  'natural-products-driftless-wi',
  'natural-products-northwoods-wi',
  'natural-products-door-county-wi',
  'natural-products-fox-valley-wi'
];

const BLOG_POSTS = [
  'raw-honey-vs-regular-honey',
  'how-to-start-cloth-diapering-wisconsin',
  'tallow-balm-benefits',
  'crunchy-mom-gift-guide-wisconsin',
  'best-wisconsin-farmers-markets'
];

const NEW_STATES = ['illinois', 'minnesota', 'michigan', 'iowa'];

const CATEGORY_TO_SLUG = {
  'Herbal Wellness': 'herbal-wellness',
  'Honey & Maple Syrup': 'raw-honey',
  'Natural Skincare': 'natural-skincare',
  'Organic Food & Local Farms': 'organic-food',
  'Candles & Home': 'natural-candles',
  'Natural Baby Products': 'natural-baby-products'
};

const STATE_NAME_TO_SLUG = {
  'Illinois': 'illinois',
  'Minnesota': 'minnesota',
  'Michigan': 'michigan',
  'Iowa': 'iowa'
};

function urlEntry(loc, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

exports.handler = async () => {
  try {
    const businesses = await fetchBusinesses();
    const entries = [];

    // Homepage
    entries.push(urlEntry(`${SITE}/`, 'weekly', '1.0'));

    // Blog index
    entries.push(urlEntry(`${SITE}/blog/`, 'weekly', '0.8'));

    // Blog posts
    for (const slug of BLOG_POSTS) {
      entries.push(urlEntry(`${SITE}/blog/${slug}/`, 'monthly', '0.7'));
    }

    // Wisconsin category pages
    for (const slug of WI_CATEGORIES) {
      entries.push(urlEntry(`${SITE}/${slug}`, 'weekly', '0.9'));
    }

    // Wisconsin region pages
    for (const slug of WI_REGIONS) {
      entries.push(urlEntry(`${SITE}/${slug}`, 'weekly', '0.8'));
    }

    // NEW: State hub pages (Illinois, Minnesota, Michigan, Iowa)
    for (const stateSlug of NEW_STATES) {
      entries.push(urlEntry(`${SITE}/${stateSlug}`, 'weekly', '0.9'));
    }

    // NEW: State-category pages — only emit combinations that have ≥1 business
    const stateCategoryCount = {};
    for (const b of businesses) {
      const stateSlug = STATE_NAME_TO_SLUG[b.state];
      const catSlug = CATEGORY_TO_SLUG[b.category];
      if (stateSlug && catSlug) {
        const key = `${catSlug}-${stateSlug}`;
        stateCategoryCount[key] = (stateCategoryCount[key] || 0) + 1;
      }
    }
    for (const key of Object.keys(stateCategoryCount)) {
      entries.push(urlEntry(`${SITE}/${key}`, 'weekly', '0.8'));
    }

    // Privacy and Terms
    entries.push(urlEntry(`${SITE}/privacy-policy/`, 'yearly', '0.3'));
    entries.push(urlEntry(`${SITE}/terms-of-use/`, 'yearly', '0.3'));

    // Individual business listings
    for (const b of businesses) {
      if (!b.name) continue;
      const slug = slugify(b.name, b.location);
      const priority = b.sponsored ? '0.7' : '0.6';
      const freq = b.sponsored ? 'monthly' : 'monthly';
      entries.push(urlEntry(`${SITE}/${slug}`, freq, priority));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      body: xml
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Error: ' + e.message };
  }
};