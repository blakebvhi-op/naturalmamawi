// render-home.js — server-rendered homepage
// Lives at: netlify/functions/render-home.js
// Mapped from "/" via netlify.toml redirect
// AD PLACEHOLDERS REMOVED — site is pre-ad-revenue, building to 50K sessions

const {
  SITE_URL,
  fetchBusinesses,
  esc,
  listingCard,
  itemListSchema,
  breadcrumbSchema,
  layout,
  relatedPagesBlock
} = require('./_helpers');

exports.handler = async () => {
  try {
    const businesses = await fetchBusinesses();
    const total = businesses.length;
    const categories = [...new Set(businesses.map(b => b.category).filter(Boolean))];

    const featured = businesses.find(b => b.sponsored) || businesses[0];

    const body = `
<main>
  <div class="eyebrow">Midwest Crunchy Mama Community</div>
  <h1>Midwest Natural Living <em>Directory</em></h1>
  <p class="lede">Find Midwest small businesses selling natural, organic and handcrafted goods — from herbal wellness and raw honey to natural skincare and baby essentials.</p>

  <div class="stat-row">
    <div class="stat"><span class="n">${total}+</span><span class="l">Businesses</span></div>
    <div class="stat"><span class="n">${categories.length}</span><span class="l">Categories</span></div>
    <div class="stat"><span class="n">Midwest</span><span class="l">Region</span></div>
  </div>

  ${featured ? `
  <section style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;margin:20px 0 30px">
    <div class="eyebrow">Featured Maker</div>
    <h2 style="margin:6px 0 8px;font-size:26px">${esc(featured.name)}</h2>
    <p style="margin:0 0 6px;color:var(--muted)">📍 ${esc(featured.location)}</p>
    <p style="margin:0 0 12px">${esc(featured.description)}</p>
    ${featured.url ? `<a href="${esc(/^https?:\/\//i.test(featured.url) ? featured.url : 'https://' + featured.url)}" target="_blank" rel="noopener nofollow" style="color:var(--accent);font-weight:600">Visit ${esc(featured.name)} →</a>` : ''}
  </section>
  ` : ''}

  <div class="section-intro">
    <h2>Find Midwest natural products <em>without the big-box search spiral.</em></h2>
    <p>naturalmamawi.com helps Midwest families discover local natural living businesses that match the way they shop: ingredient-conscious, small-batch, family-centered, and rooted close to home.</p>
    <p>Browse Midwest herbalists, raw honey farms, natural skincare makers, organic pantry shops, candle makers, apothecaries, and natural baby product brands. Every listing is rooted in the Midwest so you can support local makers instead of guessing through national marketplaces.</p>
  </div>

  ${relatedPagesBlock('')}

  <h2>Browse <em>Midwest Makers</em></h2>
  <div class="grid">
    ${businesses.map(listingCard).join('')}
  </div>

  <section style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;margin:36px 0">
    <h2 style="margin-top:0">Midwest Natural Living <em>FAQ</em></h2>

    <h3 style="font-family:var(--serif);font-size:20px;margin:18px 0 6px">What is naturalmamawi.com?</h3>
    <p style="margin:0 0 16px">naturalmamawi.com is a Midwest natural living directory for families looking for local farms, herbal wellness shops, apothecaries, natural skincare makers, cloth diapering resources, organic pantry products, and natural baby goods.</p>

    <h3 style="font-family:var(--serif);font-size:20px;margin:18px 0 6px">How do I find natural products near me in the Midwest?</h3>
    <p style="margin:0 0 16px">Browse by category (herbal wellness, raw honey, natural skincare, etc.) or by Wisconsin region (Milwaukee, Madison, Driftless, Fox Valley, Northwoods, Door County). Each page lists the businesses in that category or area.</p>

    <h3 style="font-family:var(--serif);font-size:20px;margin:18px 0 6px">Can Midwest natural living businesses list here?</h3>
    <p style="margin:0">Yes. Midwest-based small businesses can request a free basic listing, and sponsored placements are available for makers who want more visibility. <a href="mailto:hello@naturalmamawi.com?subject=List%20my%20Midwest%20natural%20business">Email to be listed</a>.</p>
  </section>
</main>
    `;

    const schema = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'naturalmamawi.com',
        url: SITE_URL,
        description: 'Midwest natural living directory — herbal wellness, raw honey, natural skincare, organic farms and baby essentials.'
      },
      itemListSchema(businesses.slice(0, 30)),
      breadcrumbSchema([{ name: 'Home', url: SITE_URL + '/' }]),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'What is naturalmamawi.com?', acceptedAnswer: { '@type': 'Answer', text: 'naturalmamawi.com is a Midwest natural living directory for families looking for local farms, herbal wellness shops, apothecaries, natural skincare makers, cloth diapering resources, organic pantry products, and natural baby goods.' } },
          { '@type': 'Question', name: 'How do I find natural products near me in the Midwest?', acceptedAnswer: { '@type': 'Answer', text: 'Browse by category or by Wisconsin region. Each page lists the businesses in that category or area.' } },
          { '@type': 'Question', name: 'Can Midwest natural living businesses list here?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Midwest-based small businesses can request a free basic listing, and sponsored placements are available.' } }
        ]
      }
    ];

    const html = layout({
      title: 'Midwest Natural Living Directory | naturalmamawi',
      description: 'Find Midwest natural living businesses: herbalists, raw honey farms, natural skincare makers, organic farms and baby goods.',
      canonical: SITE_URL + '/',
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