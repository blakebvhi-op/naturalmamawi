// sitemap.js — dynamic XML sitemap
// Lives at: netlify/functions/sitemap.js
// Mapped from /sitemap.xml via netlify.toml redirect
// OUT-OF-STATE GHOST URLS REMOVED (Chicago, Twin Cities, Detroit, Columbus, KC, Indy, St Louis)

const { SITE_URL, fetchBusinesses, slugify } = require('./_helpers');

exports.handler = async () => {
  try {
    const businesses = await fetchBusinesses();

    const staticUrls = [
      { loc: '/',                                       priority: '1.0', freq: 'weekly' },
      { loc: '/blog/',                                  priority: '0.8', freq: 'weekly' },
      { loc: '/blog/best-wisconsin-farmers-markets/',   priority: '0.7', freq: 'monthly' },
      { loc: '/blog/crunchy-mom-gift-guide-wisconsin/', priority: '0.7', freq: 'monthly' },
      { loc: '/blog/how-to-start-cloth-diapering-wisconsin/', priority: '0.7', freq: 'monthly' },
      { loc: '/blog/raw-honey-vs-regular-honey/',       priority: '0.7', freq: 'monthly' },
      { loc: '/blog/tallow-balm-benefits/',             priority: '0.7', freq: 'monthly' },

      { loc: '/herbal-wellness-wisconsin',     priority: '0.9', freq: 'weekly' },
      { loc: '/raw-honey-wisconsin',           priority: '0.9', freq: 'weekly' },
      { loc: '/natural-skincare-wisconsin',    priority: '0.9', freq: 'weekly' },
      { loc: '/organic-food-wisconsin',        priority: '0.9', freq: 'weekly' },
      { loc: '/natural-candles-wisconsin',     priority: '0.9', freq: 'weekly' },
      { loc: '/natural-baby-products-wisconsin', priority: '0.9', freq: 'weekly' },

      { loc: '/natural-products-milwaukee-wi',   priority: '0.8', freq: 'weekly' },
      { loc: '/natural-products-madison-wi',     priority: '0.8', freq: 'weekly' },
      { loc: '/natural-products-driftless-wi',   priority: '0.8', freq: 'weekly' },
      { loc: '/natural-products-northwoods-wi',  priority: '0.8', freq: 'weekly' },
      { loc: '/natural-products-door-county-wi', priority: '0.8', freq: 'weekly' },
      { loc: '/natural-products-fox-valley-wi',  priority: '0.8', freq: 'weekly' },

      { loc: '/privacy-policy/', priority: '0.3', freq: 'yearly' },
      { loc: '/terms-of-use/',   priority: '0.3', freq: 'yearly' },
    ];

    const listingUrls = businesses.map(b => ({
      loc: '/' + slugify(b.name, b.location),
      priority: b.sponsored ? '0.7' : '0.6',
      freq: 'monthly'
    }));

    const allUrls = [...staticUrls, ...listingUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
      body: xml
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error: ' + err.message };
  }
};