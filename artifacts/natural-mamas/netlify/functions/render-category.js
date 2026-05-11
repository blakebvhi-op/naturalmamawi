const { fetchBusinesses, normalize, slugify, esc, listingCard, itemListSchema, breadcrumbSchema, layout, relatedPagesBlock } = require('./_helpers');

// Wisconsin-default slugs (existing behavior, unchanged)
const WI_CATEGORIES = {
  'herbal-wellness-wisconsin': {
    name: 'Herbal Wellness',
    display: 'Wisconsin Herbal Wellness Apothecaries & Herbalists',
    intro: `<p>Wisconsin's herbal wellness community is rich with small-batch apothecaries, clinical herbalists, and bioregional herb growers. The listings below include shops, practitioners, and product makers working with locally sourced and ethically wildcrafted plants across the state.</p>`
  },
  'raw-honey-wisconsin': {
    name: 'Honey & Maple Syrup',
    display: 'Wisconsin Raw Honey & Maple Syrup Producers',
    intro: `<p>Wisconsin produces some of the country's finest raw honey and maple syrup. The listings below feature family-run apiaries and sugarbushes from across the state — most offer farm-direct sales and shipping.</p>`
  },
  'natural-skincare-wisconsin': {
    name: 'Natural Skincare',
    display: 'Wisconsin Natural Skincare Makers',
    intro: `<p>Wisconsin natural skincare makers craft tallow balms, herbal salves, handmade soaps, and clean cosmetics — most in small batches with ingredients sourced from local farms and gardens.</p>`
  },
  'organic-food-wisconsin': {
    name: 'Organic Food & Local Farms',
    display: 'Wisconsin Organic Farms & Food Producers',
    intro: `<p>Wisconsin's organic farms supply CSA shares, pasture-raised meats, and certified-organic produce throughout the state. The farms below practice regenerative agriculture and welcome direct relationships with customers.</p>`
  },
  'natural-candles-wisconsin': {
    name: 'Candles & Home',
    display: 'Wisconsin Natural Candles & Home Goods',
    intro: `<p>Wisconsin makers crafting beeswax candles, soy blends, and natural home goods — most using locally sourced wax, oils, and botanicals.</p>`
  },
  'natural-baby-products-wisconsin': {
    name: 'Natural Baby Products',
    display: 'Wisconsin Midwives, Doulas & Natural Baby Brands',
    intro: `<p>Wisconsin's natural birth and parenting community is small but exceptional. The listings below include certified midwives, doulas, lactation consultants, postpartum support, and small-batch baby product makers — most operating across multiple Wisconsin counties.</p><p>New to cloth diapering? Start with our <a href="/blog/how-to-start-cloth-diapering-wisconsin/">how to start cloth diapering in Wisconsin</a> guide.</p>`
  }
};

// Out-of-state category templates — generated dynamically below
const OUT_OF_STATE_CATEGORY_NAMES = {
  'herbal-wellness': 'Herbal Wellness',
  'raw-honey': 'Honey & Maple Syrup',
  'natural-skincare': 'Natural Skincare',
  'organic-food': 'Organic Food & Local Farms',
  'natural-candles': 'Candles & Home',
  'natural-baby-products': 'Natural Baby Products'
};

const STATE_DISPLAY = {
  illinois: 'Illinois',
  minnesota: 'Minnesota',
  michigan: 'Michigan',
  iowa: 'Iowa'
};

function buildOutOfStateCategory(slug) {
  for (const stateKey of Object.keys(STATE_DISPLAY)) {
    if (slug.endsWith('-' + stateKey)) {
      const catSlug = slug.slice(0, -1 * (stateKey.length + 1));
      const catName = OUT_OF_STATE_CATEGORY_NAMES[catSlug];
      if (!catName) return null;
      const stateName = STATE_DISPLAY[stateKey];
      return {
        name: catName,
        state: stateName,
        display: `${stateName} ${catName} Directory`,
        intro: `<p>Browse natural living businesses in the ${catName} category across ${stateName}. Every listing is verified and rooted in ${stateName} — most ship nationwide or serve customers across the region.</p>`
      };
    }
  }
  return null;
}

exports.handler = async (event) => {
  try {
    const slug = (event.queryStringParameters && event.queryStringParameters.slug)
      || (event.path || '').replace(/^\/+|\/+$/g, '').split('/').pop()
      || '';

    // Try Wisconsin-default lookup first
    let cat = WI_CATEGORIES[slug];
    let stateFilter = 'Wisconsin';

    // If not WI, try out-of-state pattern
    if (!cat) {
      const oos = buildOutOfStateCategory(slug);
      if (oos) {
        cat = oos;
        stateFilter = oos.state;
      }
    }

    if (!cat) return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Category not found' };

    const all = await fetchBusinesses();
    const businesses = all.filter(b => normalize(b.category) === normalize(cat.name) && normalize(b.state || 'Wisconsin') === normalize(stateFilter));

    businesses.sort((a, b) => {
      if (a.sponsored && !b.sponsored) return -1;
      if (!a.sponsored && b.sponsored) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    const canonical = `${process.env.SITE_URL || 'https://naturalmamawi.com'}/${slug}`;

    const body = `
<main>
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> &rsaquo; <span>${esc(cat.display)}</span>
  </nav>
  <div class="eyebrow">${esc(stateFilter)} Natural Living</div>
  <h1>${esc(cat.display)}</h1>
  ${cat.intro}
  <p class="lede">Browse ${businesses.length} verified ${esc(cat.name.toLowerCase())} ${businesses.length === 1 ? 'business' : 'businesses'} in ${esc(stateFilter)}.</p>
  <div class="grid">
    ${businesses.map(listingCard).join('')}
  </div>
  ${relatedPagesBlock(stateFilter)}
</main>
${itemListSchema(businesses, canonical)}
${breadcrumbSchema([
  { name: 'Home', url: process.env.SITE_URL || 'https://naturalmamawi.com' },
  { name: cat.display, url: canonical }
])}
`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: layout({
        title: `${cat.display} | naturalmamawi`,
        description: `${cat.display} — verified ${esc(cat.name.toLowerCase())} businesses in ${esc(stateFilter)}.`,
        canonical,
        body
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Error: ' + e.message };
  }
};