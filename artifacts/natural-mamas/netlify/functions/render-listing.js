// render-listing.js — server-rendered individual business pages
// Lives at: netlify/functions/render-listing.js
// Mapped from /:slug for individual business slugs via netlify.toml catch-all

const {
  SITE_URL,
  fetchBusinesses,
  esc,
  slugify,
  localBusinessSchema,
  breadcrumbSchema,
  layout
} = require('./_helpers');

exports.handler = async (event) => {
  try {
    const slug = ((event.queryStringParameters && event.queryStringParameters.slug) || event.path || '')
      .replace(/^\/+|\/+$/g, '');
    if (!slug) return { statusCode: 404, body: 'Listing not found' };

    const all = await fetchBusinesses();
    const b = all.find(b => slugify(b.name, b.location) === slug);
    if (!b) return { statusCode: 404, body: 'Listing not found' };

    const canonical = `${SITE_URL}/${slug}`;
    const websiteUrl = b.url
      ? (/^https?:\/\//i.test(b.url) ? b.url : 'https://' + b.url)
      : '';

    const body = `
<main style="max-width:780px">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> &rsaquo; <span>${esc(b.name)}</span>
  </nav>

  <div class="eyebrow">${esc(b.category || 'Wisconsin Natural Living')}</div>
  <h1 style="font-size:40px">${esc(b.name)}</h1>
  <p class="lede">📍 ${esc(b.location)}${b.state && b.state !== 'Wisconsin' ? ', ' + esc(b.state) : ''}</p>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 24px">
    ${b.sponsored ? '<span class="badge sponsored">Sponsored</span>' : ''}
    ${b.verified ? '<span class="badge verified">Verified</span>' : ''}
    ${b.newListing ? '<span class="badge new">New listing</span>' : ''}
    ${b.womanOwned ? '<span class="tag">Woman-owned</span>' : ''}
    ${b.organic ? '<span class="tag">Organic</span>' : ''}
    ${b.shipsNational ? '<span class="tag">Ships nationally</span>' : ''}
  </div>

  <div style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;margin-bottom:24px">
    <p style="margin:0 0 16px;font-size:17px">${esc(b.description)}</p>

    ${b.tags.length ? `
      <div class="tags" style="margin:16px 0">
        ${b.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
      </div>
    ` : ''}

    ${websiteUrl ? `
      <a href="${esc(websiteUrl)}" target="_blank" rel="noopener nofollow" style="display:inline-block;background:var(--accent);color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:10px">Visit ${esc(b.name)} →</a>
    ` : '<p style="color:var(--muted);font-style:italic">Website not listed yet. <a href="mailto:hello@naturalmamawi.com">Know it? Tell us.</a></p>'}

    ${b.rating ? `<p style="margin:16px 0 0;color:var(--rust)"><strong>★ ${b.rating.toFixed(1)}</strong> · ${esc(b.reviews)} review${b.reviews === '1' ? '' : 's'}</p>` : ''}
  </div>

  <section style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;margin-bottom:24px">
    <h2 style="margin-top:0">About ${esc(b.name)}</h2>
    <p>${esc(b.name)} is a Wisconsin natural living business listed in our <a href="/">Midwest directory</a>${b.category ? ` under the <strong>${esc(b.category)}</strong> category` : ''}. They're based in ${esc(b.location)} and serve the surrounding ${esc(b.state || 'Wisconsin')} community.</p>
    <p>Looking for more Wisconsin businesses like this one? Browse our full category and region pages below.</p>
  </section>

  <section class="related-pages">
    <h3>Browse related Wisconsin businesses</h3>
    <ul>
      <li><a href="/">All Wisconsin businesses</a></li>
      ${b.category === 'Herbal Wellness' ? '<li><a href="/herbal-wellness-wisconsin">Wisconsin herbal wellness</a></li>' : ''}
      ${b.category === 'Honey & Maple Syrup' ? '<li><a href="/raw-honey-wisconsin">Wisconsin raw honey</a></li>' : ''}
      ${b.category === 'Natural Skincare' ? '<li><a href="/natural-skincare-wisconsin">Wisconsin natural skincare</a></li>' : ''}
      ${b.category === 'Organic Food & Local Farms' ? '<li><a href="/organic-food-wisconsin">Wisconsin organic farms</a></li>' : ''}
      ${b.category === 'Candles & Home' ? '<li><a href="/natural-candles-wisconsin">Wisconsin candles & home</a></li>' : ''}
      ${b.category === 'Natural Baby Products' ? '<li><a href="/natural-baby-products-wisconsin">Wisconsin natural baby products</a></li>' : ''}
      <li><a href="/blog/">Wisconsin natural living blog</a></li>
    </ul>
  </section>
</main>
    `;

    const schema = [
      localBusinessSchema(b),
      breadcrumbSchema([
        { name: 'Home', url: SITE_URL + '/' },
        { name: b.name, url: canonical }
      ])
    ];

    const html = layout({
      title: `${b.name} — ${b.location} | naturalmamawi`,
      description: b.description ? b.description.slice(0, 158) : `${b.name} is a Wisconsin natural living business in ${b.location}.`,
      canonical,
      body,
      schema
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      body: html
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error: ' + err.message };
  }
};