// _helpers.js — shared utilities for all render functions
// Lives at: netlify/functions/_helpers.js

const SUPABASE_URL = 'https://mjexawgqmbfssfmlxcaw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZXhhd2dxbWJmc3NmbWx4Y2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDc4OTcsImV4cCI6MjA5MjA4Mzg5N30.EW3Mh_y1IECt-rrDyDTTaemLBMN5JYnncIMppReBHls';

const SITE_URL = 'https://naturalmamawi.com';
const SITE_NAME = 'naturalmamawi.com';

async function fetchBusinesses(params = {}) {
  const qs = new URLSearchParams({
    select: '*',
    order: 'sponsored.desc,rating.desc',
    ...params
  });
  const url = `${SUPABASE_URL}/rest/v1/businesses?${qs}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows.map(normalize);
}

function normalize(b) {
  return {
    id: b.id,
    name: b.name || '',
    location: b.location || '',
    url: b.url || '',
    category: b.category || '',
    description: b.description || '',
    tags: typeof b.tags === 'string'
      ? b.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [],
    emoji: b.emoji || '🌿',
    rating: Number(b.rating) || 0,
    reviews: String(b.reviews || '0'),
    sponsored: !!b.sponsored,
    verified: !!b.verified,
    newListing: !!b.new_listing,
    shipsNational: !!b.ships_national,
    womanOwned: !!b.woman_owned,
    organic: !!b.organic,
    region: b.region || '',
    state: b.state || 'Wisconsin'
  };
}

function slugify(name, location) {
  const base = `${name}-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return base;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function listingCard(b) {
  const slug = slugify(b.name, b.location);
  const tags = b.tags.slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const badges = [
    b.sponsored ? '<span class="badge sponsored">Sponsored</span>' : '',
    b.newListing ? '<span class="badge new">New</span>' : '',
    b.verified ? '<span class="badge verified">Verified</span>' : '',
  ].join('');
  const link = b.url
    ? `<a class="visit" href="${esc(/^https?:\/\//i.test(b.url) ? b.url : 'https://' + b.url)}" target="_blank" rel="noopener nofollow">Visit website ↗</a>`
    : '';
  return `
    <article class="card">
      <div class="card-head">
        <span class="emoji" aria-hidden="true">${esc(b.emoji)}</span>
        <div class="badges">${badges}</div>
      </div>
      <h3><a href="/${slug}">${esc(b.name)}</a></h3>
      <p class="loc">📍 ${esc(b.location)}</p>
      <p class="desc">${esc(b.description)}</p>
      <div class="tags">${tags}</div>
      <div class="meta">
        ${b.rating ? `<span class="rating">★ ${b.rating.toFixed(1)}</span>` : ''}
        ${link}
      </div>
    </article>
  `;
}

function localBusinessSchema(b) {
  const slug = slugify(b.name, b.location);
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: b.name,
    description: b.description,
    address: { '@type': 'PostalAddress', addressLocality: b.location, addressRegion: b.state, addressCountry: 'US' },
    url: b.url ? (/^https?:\/\//i.test(b.url) ? b.url : 'https://' + b.url) : undefined,
    '@id': `${SITE_URL}/${slug}`,
    aggregateRating: b.rating ? {
      '@type': 'AggregateRating',
      ratingValue: b.rating,
      reviewCount: Number(b.reviews) || 1
    } : undefined
  };
}

function itemListSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/${slugify(b.name, b.location)}`,
      name: b.name
    }))
  };
}

function breadcrumbSchema(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url
    }))
  };
}

function layout({ title, description, canonical, body, schema, ogImage }) {
  const schemaJson = (schema || []).filter(Boolean).map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${SITE_NAME}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="theme-color" content="#3D5C30">
${schemaJson}
<style>
:root{--bg:#F7F2E9;--ink:#2A2522;--muted:#6C6157;--accent:#3D5C30;--accent-soft:#E9E2D2;--rust:#B0512A;--card:#FFFDF8;--line:#E1D9C7;--serif:"Cormorant Garamond","Playfair Display",Georgia,serif;--sans:"Inter",system-ui,-apple-system,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.6;font-size:16px}
a{color:var(--accent);text-decoration:underline;text-underline-offset:2px}
a:hover{color:var(--rust)}
header.site{background:var(--card);border-bottom:1px solid var(--line);padding:14px 22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
header.site .brand{font-family:var(--serif);font-size:22px;font-weight:600;color:var(--ink);text-decoration:none}
header.site .brand .accent{color:var(--rust)}
header.site .nav{font-size:14px;color:var(--muted)}
header.site .nav a{color:var(--muted);text-decoration:none;margin-left:16px}
header.site .nav a:hover{color:var(--accent)}
header.site .cta{background:var(--accent);color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:.04em}
header.site .cta:hover{background:var(--rust);color:#fff}
main{max-width:1100px;margin:0 auto;padding:30px 22px 60px}
.crumbs{font-size:13px;color:var(--muted);margin-bottom:18px}
.crumbs a{color:var(--muted);text-decoration:none}
.crumbs a:hover{color:var(--accent)}
.eyebrow{font-family:var(--sans);font-size:12px;font-weight:600;letter-spacing:.18em;color:var(--rust);text-transform:uppercase;margin-bottom:10px}
h1{font-family:var(--serif);font-size:44px;line-height:1.08;font-weight:600;margin:0 0 14px;color:var(--ink)}
h1 em{font-style:italic;color:var(--accent);font-weight:500}
.lede{font-size:18px;color:var(--muted);margin:0 0 28px;max-width:720px}
.stat-row{display:flex;gap:36px;flex-wrap:wrap;margin:24px 0 36px;padding:18px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.stat{font-family:var(--serif)}
.stat .n{font-size:30px;color:var(--accent);font-weight:600;display:block;line-height:1}
.stat .l{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.15em;margin-top:6px;display:block}
h2{font-family:var(--serif);font-size:30px;font-weight:600;margin:42px 0 10px;line-height:1.2}
h2 em{font-style:italic;color:var(--accent);font-weight:500}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px;margin:14px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px;display:flex;flex-direction:column}
.card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.emoji{font-size:30px}
.badges{display:flex;gap:4px;flex-wrap:wrap}
.badge{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;padding:3px 8px;border-radius:20px}
.badge.sponsored{background:var(--rust);color:#fff}
.badge.new{background:var(--accent);color:#fff}
.badge.verified{background:var(--accent-soft);color:var(--accent)}
.card h3{font-family:var(--serif);font-size:21px;margin:6px 0 4px;line-height:1.2}
.card h3 a{color:var(--ink);text-decoration:none}
.card h3 a:hover{color:var(--accent)}
.card .loc{font-size:13px;color:var(--muted);margin:0 0 8px}
.card .desc{font-size:14px;color:var(--ink);margin:0 0 12px;flex:1}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.tag{font-size:11px;background:var(--accent-soft);color:var(--accent);padding:3px 8px;border-radius:14px}
.card .meta{display:flex;justify-content:space-between;align-items:center;font-size:13px;border-top:1px solid var(--line);padding-top:10px;margin-top:auto}
.rating{color:var(--rust);font-weight:600}
.visit{color:var(--accent);text-decoration:none;font-weight:600}
.visit:hover{color:var(--rust)}
.section-intro{max-width:740px;margin:18px 0 24px;color:var(--ink)}
.section-intro p{margin:0 0 12px}
.related-pages{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px;margin:36px 0}
.related-pages h3{margin:0 0 12px;font-family:var(--serif);font-size:18px}
.related-pages ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.related-pages li{margin:0}
.related-pages a{display:block;padding:8px 12px;background:var(--bg);border-radius:6px;text-decoration:none;color:var(--ink);font-size:14px}
.related-pages a:hover{background:var(--accent-soft);color:var(--accent)}
footer{background:var(--card);border-top:1px solid var(--line);padding:30px 22px;text-align:center;color:var(--muted);font-size:13px}
footer .links{margin-bottom:8px}
footer a{color:var(--muted);text-decoration:none;margin:0 10px}
footer a:hover{color:var(--accent)}
.empty{text-align:center;padding:60px 20px;color:var(--muted);background:var(--card);border-radius:10px;border:1px solid var(--line)}
@media(max-width:600px){h1{font-size:32px}h2{font-size:22px}main{padding:22px 16px 50px}.stat-row{gap:18px}.stat .n{font-size:24px}}
</style>
</head>
<body>

<header class="site">
  <a class="brand" href="/">naturalmama<span class="accent">wi</span>.com</a>
  <nav class="nav">
    <a href="/">Directory</a>
    <a href="/blog/">Blog</a>
    <a class="cta" href="mailto:hello@naturalmamawi.com?subject=List%20my%20Midwest%20natural%20business">List Your Business</a>
  </nav>
</header>

${body}

<footer>
  <div class="links">
    <a href="/">Browse Directory</a>·
    <a href="/blog/">Blog</a>·
    <a href="/privacy-policy/">Privacy</a>·
    <a href="/terms-of-use/">Terms</a>·
    <a href="mailto:hello@naturalmamawi.com">Contact</a>
  </div>
  <p>© 2026 ${SITE_NAME} — Midwest natural living directory for small businesses, farms, makers and families.</p>
</footer>

</body>
</html>`;
}

function relatedPagesBlock(currentSlug) {
  const pages = [
    { slug: 'herbal-wellness-wisconsin', label: '🌿 Herbal Wellness' },
    { slug: 'raw-honey-wisconsin', label: '🍯 Raw Honey & Maple' },
    { slug: 'natural-skincare-wisconsin', label: '🧼 Natural Skincare' },
    { slug: 'organic-food-wisconsin', label: '🌾 Organic Food & Farms' },
    { slug: 'natural-candles-wisconsin', label: '🕯️ Candles & Home' },
    { slug: 'natural-baby-products-wisconsin', label: '👶 Baby Essentials' },
    { slug: 'natural-products-milwaukee-wi', label: '📍 Milwaukee Area' },
    { slug: 'natural-products-madison-wi', label: '📍 Madison Area' },
    { slug: 'natural-products-driftless-wi', label: '📍 Driftless Region' },
    { slug: 'natural-products-fox-valley-wi', label: '📍 Fox Valley' },
    { slug: 'natural-products-northwoods-wi', label: '📍 Northwoods' },
    { slug: 'natural-products-door-county-wi', label: '📍 Door County' },
  ].filter(p => p.slug !== currentSlug);
  return `
    <section class="related-pages">
      <h3>Explore more Wisconsin natural living</h3>
      <ul>
        ${pages.map(p => `<li><a href="/${p.slug}">${p.label}</a></li>`).join('')}
      </ul>
    </section>
  `;
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_KEY,
  SITE_URL,
  SITE_NAME,
  fetchBusinesses,
  normalize,
  slugify,
  esc,
  listingCard,
  localBusinessSchema,
  itemListSchema,
  breadcrumbSchema,
  layout,
  relatedPagesBlock
};