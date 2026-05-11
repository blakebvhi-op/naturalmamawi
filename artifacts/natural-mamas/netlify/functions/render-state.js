const { fetchBusinesses, esc, listingCard, breadcrumbSchema, layout } = require('./_helpers');

const STATES = {
  illinois: {
    name: 'Illinois',
    intro: `<p>Illinois is home to a growing community of small-batch natural living businesses — from Chicago herbalists and Wauconda beekeepers to family farms across the Chicagoland suburbs. Browse verified Illinois businesses by category below.</p>`
  },
  minnesota: {
    name: 'Minnesota',
    intro: `<p>Minnesota's natural living scene runs deep — from the Twin Cities herbal apothecaries to North Shore organic maple producers and prairie honey farms. Browse verified Minnesota businesses by category below.</p>`
  },
  michigan: {
    name: 'Michigan',
    intro: `<p>Michigan supports a strong network of natural living makers — from Grand Rapids herbalists and Upper Peninsula maple producers to family farms across the Lower Peninsula. Browse verified Michigan businesses by category below.</p>`
  },
  iowa: {
    name: 'Iowa',
    intro: `<p>Iowa's natural living community is rooted in family farms — from Driftless region herbalists to multi-generation maple syrup makers and small-batch tallow skincare from family-raised cattle. Browse verified Iowa businesses by category below.</p>`
  }
};

const CATEGORY_SLUG = {
  'Herbal Wellness': 'herbal-wellness',
  'Honey & Maple Syrup': 'raw-honey',
  'Natural Skincare': 'natural-skincare',
  'Organic Food & Local Farms': 'organic-food',
  'Candles & Home': 'natural-candles',
  'Natural Baby Products': 'natural-baby-products'
};

exports.handler = async (event) => {
  try {
    const slug = (event.queryStringParameters && event.queryStringParameters.slug)
      || (event.path || '').replace(/^\/+|\/+$/g, '').split('/').pop()
      || '';

    const stateInfo = STATES[slug];
    if (!stateInfo) {
      return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'State not found' };
    }

    const all = await fetchBusinesses();
    const businesses = all.filter(b => b.state === stateInfo.name);

    businesses.sort((a, b) => {
      if (a.sponsored && !b.sponsored) return -1;
      if (!a.sponsored && b.sponsored) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    // Group by category
    const byCategory = {};
    for (const biz of businesses) {
      if (!byCategory[biz.category]) byCategory[biz.category] = [];
      byCategory[biz.category].push(biz);
    }

    const canonical = `${process.env.SITE_URL || 'https://naturalmamawi.com'}/${slug}`;

    // Build category sections
    const categorySections = Object.keys(byCategory).map(catName => {
      const catBusinesses = byCategory[catName];
      const catSlug = CATEGORY_SLUG[catName];
      const catLink = catSlug ? `${catSlug}-${slug}` : '';
      return `
        <section class="category-section">
          <h2>${esc(catName)} in ${esc(stateInfo.name)}</h2>
          <div class="grid">
            ${catBusinesses.map(listingCard).join('')}
          </div>
          ${catLink ? `<p class="see-more"><a href="/${catLink}">See all ${esc(catName)} in ${esc(stateInfo.name)} &rarr;</a></p>` : ''}
        </section>
      `;
    }).join('');

    const body = `
<main>
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> &rsaquo; <span>${esc(stateInfo.name)}</span>
  </nav>
  <div class="eyebrow">Midwest Natural Living</div>
  <h1>${esc(stateInfo.name)} Natural Living Directory</h1>
  ${stateInfo.intro}
  <p class="lede">Browse ${businesses.length} verified ${businesses.length === 1 ? 'business' : 'businesses'} in ${esc(stateInfo.name)}.</p>
  ${categorySections}
</main>
${breadcrumbSchema([
  { name: 'Home', url: process.env.SITE_URL || 'https://naturalmamawi.com' },
  { name: stateInfo.name, url: canonical }
])}
`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: layout({
        title: `${stateInfo.name} Natural Living Directory | naturalmamawi`,
        description: `Browse ${businesses.length} verified natural living businesses across ${stateInfo.name} — herbalists, honey producers, organic farms, midwives, and natural skincare makers.`,
        canonical,
        body
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Error: ' + e.message };
  }
};