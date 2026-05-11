// render-category.js — server-rendered category pages
// Lives at: netlify/functions/render-category.js
// Mapped from /:slug for the 6 category slugs via netlify.toml

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

const CATEGORIES = {
  'herbal-wellness-wisconsin': {
    h1Lead: 'Wisconsin Herbal Wellness',
    h1Tail: 'Apothecaries & Herbalists',
    metaTitle: 'Wisconsin Herbal Wellness Shops & Apothecaries | naturalmamawi',
    metaDesc: 'Browse Wisconsin herbalists, apothecaries, tincture makers and herbal wellness shops — small-batch, locally grown.',
    dbCategory: 'Herbal Wellness',
    intro: `<p>Wisconsin's herbal wellness scene runs deep — from certified organic farms in the Driftless region to apothecaries in Milwaukee and Madison, the state has one of the strongest concentrations of small herbal businesses in the Midwest. The shops below grow, harvest, blend or formulate their own teas, tinctures, salves and herbal supplements.</p><p>Every listing is a small Wisconsin business. Use the descriptions and tags to find herbalists working in your area or shipping statewide.</p>`
  },
  'raw-honey-wisconsin': {
    h1Lead: 'Wisconsin Raw Honey',
    h1Tail: '& Maple Syrup Producers',
    metaTitle: 'Wisconsin Raw Honey Farms & Maple Syrup Producers | naturalmamawi',
    metaDesc: 'Wisconsin raw honey producers, family apiaries and small-batch maple syrup farms — bought direct from the farm.',
    dbCategory: 'Honey & Maple Syrup',
    intro: `<p>Wisconsin produces some of the country's best raw honey and maple syrup, thanks to cold winters, wildflower diversity and a tradition of small family apiaries. None of the farms below pasteurize or ultra-filter their honey — what comes out of the hive is what goes in the jar.</p><p>Read our <a href="/blog/raw-honey-vs-regular-honey/">raw honey vs regular honey guide</a> if you want to understand exactly why "raw" matters on a label.</p>`
  },
  'natural-skincare-wisconsin': {
    h1Lead: 'Wisconsin Natural',
    h1Tail: 'Skincare Makers',
    metaTitle: 'Wisconsin Natural Skincare Makers, Soaps & Tallow Balms | naturalmamawi',
    metaDesc: 'Browse Wisconsin natural skincare makers — small-batch soaps, tallow balms, salves and face oils made with clean ingredients.',
    dbCategory: 'Natural Skincare',
    intro: `<p>Wisconsin's small skincare community focuses on short ingredient lists and locally sourced raw materials — including grass-fed tallow from Wisconsin cattle, beeswax from Wisconsin apiaries, and herb-infused oils from Wisconsin farms. Most makers below sell direct, ship statewide, and accept custom orders.</p><p>New to tallow-based skincare? Start with our <a href="/blog/tallow-balm-benefits/">tallow balm benefits guide</a>.</p>`
  },
  'organic-food-wisconsin': {
    h1Lead: 'Wisconsin Organic',
    h1Tail: 'Farms & Local Food',
    metaTitle: 'Wisconsin Organic Farms, CSAs & Local Food | naturalmamawi',
    metaDesc: 'Wisconsin organic farms, CSAs and farm-direct local food — pasture-raised meat, vegetables, eggs and pantry goods.',
    dbCategory: 'Organic Food & Local Farms',
    intro: `<p>From the Driftless's biodynamic veg farms to southeastern Wisconsin's pasture-raised meat operations, the farms below are Wisconsin-rooted, mostly certified organic, and sell direct to families through CSAs, on-farm pickup or local markets. For market-day shopping, our <a href="/blog/best-wisconsin-farmers-markets/">guide to Wisconsin farmers markets</a> covers the best spots in every region.</p>`
  },
  'natural-candles-wisconsin': {
    h1Lead: 'Wisconsin Natural',
    h1Tail: 'Candles & Home Goods',
    metaTitle: 'Wisconsin Natural Candles & Home Goods | naturalmamawi',
    metaDesc: 'Wisconsin natural candles, soy and beeswax candles, and small-batch home goods from local makers.',
    dbCategory: 'Candles & Home',
    intro: `<p>Hand-poured soy and beeswax candles, room sprays, hand-made home goods — all from Wisconsin small businesses using clean ingredients and refusing the synthetic fragrance shortcuts that dominate the candle industry.</p>`
  },
  'natural-baby-products-wisconsin': {
    h1Lead: 'Wisconsin Natural',
    h1Tail: 'Baby & Birth Services',
    metaTitle: 'Wisconsin Natural Baby Products, Doulas & Midwives | naturalmamawi',
    metaDesc: 'Wisconsin natural baby product makers, doulas, midwives, lactation consultants and birth services for crunchy families.',
    dbCategory: 'Natural Baby Products',
    intro: `<p>Wisconsin's natural birth and parenting community is small but exceptional. The listings below include certified midwives, doulas, lactation consultants, postpartum support, and small-batch baby product makers — most operating across multiple Wisconsin counties.</p><p>New to cloth diapering? Start with our <a href="/blog/how-to-start-cloth-diapering-wisconsin/">how to start cloth diapering in Wisconsin</a> guide.</p>`
  }
};

exports.handler = async (event) => {
  try {
    const slug = (event.queryStringParameters && event.queryStringParameters.slug) || '';
    const cat = CATEGORIES[slug];
    if (!cat) return { statusCode: 404, body: 'Category not found' };

    const all = await fetchBusinesses();
    const businesses = all.filter(b => b.category === cat.dbCategory);

    const canonical = `${SITE_URL}/${slug}`;

    const body = `
<main>
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> &rsaquo; <span>${esc(cat.h1Lead)}</span>
  </nav>
  <div class="eyebrow">Wisconsin Natural Living</div>
  <h1>${esc(cat.h1Lead)} <em>${esc(cat.h1Tail)}</em></h1>
  <p class="lede">Browse ${businesses.length} ${esc(cat.dbCategory.toLowerCase())} ${businesses.length === 1 ? 'business' : 'businesses'} listed in Wisconsin.</p>

  <div class="section-intro">${cat.intro}</div>

  ${businesses.length === 0 ? `
    <div class="empty">
      <p>No listings yet for this category. <a href="mailto:hello@naturalmamawi.com?subject=List%20my%20Midwest%20natural%20business">Know a Wisconsin business that fits? Let us know.</a></p>
    </div>
  ` : `
    <div class="grid">
      ${businesses.map(listingCard).join('')}
    </div>
  `}

  ${relatedPagesBlock(slug)}
</main>
    `;

    const schema = [
      itemListSchema(businesses),
      breadcrumbSchema([
        { name: 'Home', url: SITE_URL + '/' },
        { name: cat.h1Lead + ' ' + cat.h1Tail, url: canonical }
      ])
    ];

    const html = layout({
      title: cat.metaTitle,
      description: cat.metaDesc,
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