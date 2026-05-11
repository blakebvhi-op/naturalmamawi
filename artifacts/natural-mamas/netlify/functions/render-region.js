// render-region.js — server-rendered Wisconsin region pages
// Lives at: netlify/functions/render-region.js
// Mapped from /:slug for the 6 WI region slugs via netlify.toml

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

const REGIONS = {
  'natural-products-milwaukee-wi': {
    display: 'Milwaukee Area',
    metaTitle: 'Natural Products in the Milwaukee Area, WI | naturalmamawi',
    metaDesc: 'Browse natural living businesses around Milwaukee, WI — herbalists, raw honey, natural skincare, doulas and more.',
    intro: `<p>The Milwaukee metro and its southeastern Wisconsin neighbors are home to one of the densest concentrations of natural living businesses in the state. The listings below are based in Milwaukee, Waukesha, Ozaukee, Racine, Kenosha, Walworth, and Washington counties — or serve them directly.</p>`,
    cities: ['milwaukee','waukesha','ozaukee','racine','kenosha','walworth','washington','mequon','wauwatosa','brookfield','bay view','elm grove','new berlin','muskego','franklin','oak creek','elkhorn','ashippun']
  },
  'natural-products-madison-wi': {
    display: 'Madison Area',
    metaTitle: 'Natural Products in the Madison Area, WI | naturalmamawi',
    metaDesc: 'Browse natural living businesses around Madison, WI and the surrounding Dane County area.',
    intro: `<p>Madison and the surrounding Dane County are a hub for organic farming, herbal wellness, and natural skincare. The listings below are based in or serve the greater Madison area — from McFarland to Sun Prairie to Mount Horeb.</p>`,
    cities: ['madison','dane','mcfarland','sun prairie','middleton','verona','fitchburg','stoughton','mount horeb','waunakee','oregon','cottage grove','de forest']
  },
  'natural-products-driftless-wi': {
    display: 'Driftless Region',
    metaTitle: 'Natural Products in the Driftless Region, WI | naturalmamawi',
    metaDesc: 'Natural living businesses in Wisconsin\'s Driftless region — biodynamic farms, herbalists and small artisan makers.',
    intro: `<p>Southwest Wisconsin's Driftless region has the highest concentration of certified organic farms in the country. The listings below include biodynamic vegetable growers, traditional apothecaries, and small artisan makers across Vernon, Crawford, Richland, and surrounding counties.</p>`,
    cities: ['viroqua','westby','la crosse','prairie du chien','spring green','muscoda','soldiers grove','readstown','gays mills','baraboo','reedsburg','richland center','dodgeville','mineral point']
  },
  'natural-products-northwoods-wi': {
    display: 'Northwoods Wisconsin',
    metaTitle: 'Natural Products in Northwoods Wisconsin | naturalmamawi',
    metaDesc: 'Natural living businesses across Northwoods Wisconsin — Vilas, Oneida, Forest, Iron and surrounding counties.',
    intro: `<p>Northwoods Wisconsin's short growing season and forested landscape produce some of the most distinctive natural goods in the state — wild-harvested honey, foraged herbs, and small farm operations across Vilas, Oneida, Forest, Iron and Price counties.</p>`,
    cities: ['eagle river','rhinelander','minocqua','phillips','park falls','hayward','hurley','tomahawk','antigo','crandon','three lakes','land o lakes','manitowish waters','st germain']
  },
  'natural-products-door-county-wi': {
    display: 'Door County',
    metaTitle: 'Natural Products in Door County, WI | naturalmamawi',
    metaDesc: 'Natural living businesses across Door County, Wisconsin — small-batch makers, farms and natural skincare.',
    intro: `<p>Door County's peninsula geography produces a distinctive set of natural goods — cherries, maple, lavender, and a community of small-batch makers across Sturgeon Bay, Egg Harbor, Fish Creek, Sister Bay and the surrounding villages.</p>`,
    cities: ['sturgeon bay','egg harbor','fish creek','sister bay','baileys harbor','ephraim','jacksonport','gills rock']
  },
  'natural-products-fox-valley-wi': {
    display: 'Fox Valley',
    metaTitle: 'Natural Products in the Fox Valley, WI | naturalmamawi',
    metaDesc: 'Natural living businesses across the Fox Valley — Appleton, Oshkosh, Green Bay and surrounding cities.',
    intro: `<p>The Fox Valley — Appleton, Oshkosh, Neenah, Menasha, Kaukauna, and the greater Green Bay area — has a quietly strong natural-living scene rooted in family farms and small herbal apothecaries. The listings below are based in or serve the Fox Valley region.</p>`,
    cities: ['appleton','oshkosh','neenah','menasha','kaukauna','green bay','de pere','little chute','kimberly','fond du lac','waupaca','new london','clintonville','seymour','baldwin']
  }
};

exports.handler = async (event) => {
  try {
    const slug = (event.queryStringParameters && event.queryStringParameters.slug) || '';
    const region = REGIONS[slug];
    if (!region) return { statusCode: 404, body: 'Region not found' };

    const all = await fetchBusinesses();
    const businesses = all.filter(b => {
      const loc = (b.location || '').toLowerCase();
      return region.cities.some(c => loc.includes(c));
    });

    const canonical = `${SITE_URL}/${slug}`;

    const body = `
<main>
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> &rsaquo; <span>${esc(region.display)}</span>
  </nav>
  <div class="eyebrow">Wisconsin Natural Living</div>
  <h1>Natural Products in <em>${esc(region.display)}</em></h1>
  <p class="lede">Browse ${businesses.length} Wisconsin natural living ${businesses.length === 1 ? 'business' : 'businesses'} in or serving ${esc(region.display)}.</p>

  <div class="section-intro">${region.intro}</div>

  ${businesses.length === 0 ? `
    <div class="empty">
      <p>No listings yet in this region. <a href="/">Browse the full Wisconsin directory</a> or <a href="mailto:hello@naturalmamawi.com?subject=List%20my%20Midwest%20natural%20business">submit a business to be listed</a>.</p>
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
        { name: 'Natural Products in ' + region.display, url: canonical }
      ])
    ];

    const html = layout({
      title: region.metaTitle,
      description: region.metaDesc,
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