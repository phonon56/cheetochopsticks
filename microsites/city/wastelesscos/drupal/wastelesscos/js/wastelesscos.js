/**
 * @file
 * WastelessCOS — tabs, directory, sorting guide.
 * Drupal.behaviors so the page works inside the city's Drupal theme.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.wastelessCos = {
    attach: function (context) {
      once('wastelesscos', '.wlc', context).forEach(initPage);
    }
  };

  function initPage(root) {
    wireDisclosure(root, 'translateBtn', 'translatePanel');
    wireDisclosure(root, 'transcriptBtn', 'transcriptPanel');
    wireTranslate(root);
    wireTabs(root);
    wireDirectory(root);
    wireSortingGuide(root);
  }

  function wireDisclosure(root, btnId, panId) {
    var btn = root.querySelector('#' + btnId);
    var pan = root.querySelector('#' + panId);
    if (!btn || !pan) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      pan.hidden = open;
    });
  }

  function wireTranslate(root) {
    var sel = root.querySelector('#langSelect');
    if (!sel) return;
    sel.addEventListener('change', function (e) {
      var lang = e.target.value;
      if (!lang || lang === 'en') return;
      var u = 'https://translate.google.com/translate?sl=en&tl=' + encodeURIComponent(lang) +
              '&u=' + encodeURIComponent(location.href);
      window.open(u, '_blank', 'noopener');
    });
  }

  function wireTabs(root) {
    var tl = root.querySelector('[role="tablist"]');
    if (!tl) return;
    var tabs = [].slice.call(tl.querySelectorAll('[role="tab"]'));
    function sel(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        root.querySelector('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) {
        var n = i;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        else return;
        e.preventDefault();
        sel(tabs[n]);
        tabs[n].focus();
      });
    });
  }

  /* ---------- Directory ---------- */

  var R = [
    { n: 'Apex Waste Solutions', who: 'private', free: false, cats: ['private', 'curbside', 'bulk', 'recycle'], web: 'https://apexwasteco.com', phone: '',
      d: 'Locally owned weekly curbside trash and recycling. Online address map shows your pickup day and recycling week.' },
    { n: 'Waste Management (WM)', who: 'private', free: false, cats: ['private', 'curbside', 'recycle'], web: 'https://www.wm.com', phone: '',
      d: 'Large hauler with low-emission CNG trucks and an app for scheduling. Trash plus single-stream recycling.' },
    { n: 'Waste Connections', who: 'private', free: false, cats: ['private', 'curbside', 'bulk', 'recycle'], web: 'https://www.wasteconnections.com/colorado-springs', phone: '719-591-5000',
      d: 'Residential and commercial trash, recycling, and roll-off dumpsters across El Paso County.' },
    { n: 'Republic Services', who: 'private', free: false, cats: ['private', 'curbside', 'bulk', 'recycle'], web: 'https://www.republicservices.com', phone: '',
      d: 'Curbside trash, single-stream recycling, and dumpster rental. No plastic bags in recycling.' },
    { n: 'SOCO Waste', who: 'private', free: false, cats: ['private', 'curbside', 'bulk'], web: 'https://www.socowaste.com', phone: '',
      d: 'Local hauler offering bear-resistant cart service, dumpsters, and curbside junk removal.' },
    { n: 'HBS Trash', who: 'private', free: false, cats: ['private', 'curbside', 'bulk'], web: 'https://www.hbstrash.com', phone: '',
      d: '25+ years serving the Springs and eastern county (incl. Calhan). 95-gallon cart, once-weekly pickup.' },
    { n: 'Infinite Disposal', who: 'private', free: false, cats: ['private', 'curbside'], web: '', phone: '',
      d: 'Locally owned and operated curbside trash and recycling service. Search the company name to confirm current contact info and service area.' },
    { n: 'Junk King (bulk & junk removal)', who: 'private', free: false, cats: ['bulk'], web: 'https://www.junk-king.com', phone: '1-888-888-5865',
      d: 'Full-service hauling for furniture, appliances, and large cleanouts. Eco-friendly sorting for reuse/recycling.' },
    { n: 'Galvanize Recycling', who: 'private', free: false, cats: ['recycle', 'ewaste', 'bulk', 'yard'], web: 'https://galvanizerecycling.com', phone: '719-645-4165',
      d: 'Broad recycler — TVs and electronics, microwaves, fluorescent bulbs &amp; ballasts, smoke alarms, batteries, nursery pots, plastic bags, shoes, fabric, vinyl records, construction debris, and untreated wood pallets. Call for current acceptance and fees.' },
    { n: 'Peak Disposal & Recycling', who: 'private', free: false, cats: ['private', 'bulk', 'recycle'], web: 'https://www.peakdr.com', phone: '719-481-2340',
      d: 'Monument-area transfer station, dumpsters, and bulk pickup at 856 Washington St. Accepts appliances (including freon), mattresses &amp; box springs, and metals.' },
    { n: 'El Paso County Household Hazardous Waste Facility', who: 'county', free: true, cats: ['city', 'hazard', 'recycle', 'ewaste'], web: 'https://communityresources.elpasoco.com/environmental-division/household-hazardous-waste/', phone: '719-520-7878',
      d: 'FREE drop-off for paint, chemicals, pesticides, antifreeze, batteries, bulbs, and many electronics. 3255 Akers Dr. Hours: Mon/Tue/Thu/Fri 8:30am–noon &amp; 1–4pm; Wed 8:30am–noon (recycling drop-off &amp; reuse area also open Wed). 2026 Saturdays 8:30am–noon: Jan 10, Mar 14, May 9, Jul 11, Sep 19, Nov 7. Bring photo ID; El Paso &amp; Teller County residents only.' },
    { n: 'El Paso County Recycling Directory', who: 'county', free: true, cats: ['city', 'recycle', 'tip', 'ewaste', 'hazard'], web: 'https://epc-assets.elpasoco.com/wp-content/uploads/sites/20/Recycling-Directory-2026.pdf', phone: '',
      d: 'FREE searchable guide listing where to take almost any specific item in the county.' },
    { n: 'E-Tech Recyclers', who: 'private', free: false, cats: ['recycle', 'ewaste'], web: 'https://www.etechrecyclers.com', phone: '719-799-6517',
      d: 'Electronics recycling at 2854 N. Prospect St. Takes large/CRT TVs for a small fee, household batteries, microwaves, ink &amp; toner cartridges, and may pay you for working computers.' },
    { n: 'Best Buy electronics drop-off', who: 'private', free: true, cats: ['recycle', 'ewaste'], web: 'https://www.bestbuy.com/recycling', phone: '',
      d: 'Free in-store recycling for many small electronics, cables, and accessories (limits apply per day).' },
    { n: 'Batteries Plus', who: 'private', free: false, cats: ['ewaste', 'recycle'], web: 'https://www.batteriesplus.com', phone: '',
      d: 'Drop-off recycling for household batteries and fluorescent light bulbs.' },
    { n: 'Wine Punts LLC', who: 'private', free: true, cats: ['recycle', 'ewaste'], web: '', phone: '719-418-2691',
      d: 'FREE drop-off for small appliances, limited electronics, auto batteries, aluminum, and scrap metal. 30 W. Las Vegas St.' },
    { n: 'Woodmen Dump', who: 'private', free: false, cats: ['recycle', 'bulk', 'yard'], web: 'https://www.woodmendump.com', phone: '719-792-3867',
      d: 'Drop-off site on the north side. 8808 Cliff Allen Pt. Call to confirm accepted items and fees.' },
    { n: 'Colorado Springs Landfill (fridges & freezers)', who: 'private', free: false, cats: ['bulk', 'recycle'], web: '', phone: '719-683-2600',
      d: 'Accepts refrigerators and freezers, which need special refrigerant handling. 1010 Blaney Rd.' },
    { n: 'Rocky Top Resources', who: 'private', free: false, cats: ['yard', 'recycle'], web: 'https://rockytopresources.com', phone: '719-579-9103',
      d: 'Yard-waste drop-off at 1755 E. Las Vegas St. Hosts the El Paso County Yard Waste Recycling Program Saturdays 8am–4pm ($10 per vehicle, households only). Sells finished mulch and compost. Also takes untreated lumber and live Christmas trees.' },
    { n: 'Free City mulch', who: 'city', free: true, cats: ['yard', 'city', 'tip'], web: 'https://coloradosprings.gov', phone: '',
      d: 'FREE mulch giveaway from designated City locations — great for beds and water-saving.' },
    { n: 'Ask your landscaper for free wood chips', who: 'tip', free: true, cats: ['yard', 'tip'], web: '', phone: '',
      d: 'Local landscapers and arborists often give away or let you pick up wood chips for free or a small fee instead of paying to dump them. Just ask.' },
    { n: 'Compost at home', who: 'tip', free: true, cats: ['yard', 'tip'], web: '', phone: '',
      d: 'Food scraps and yard debris are the two biggest things we throw away. A backyard bin cuts your trash and feeds your garden.' },
    { n: 'Goodwill / donation centers', who: 'nonprofit', free: true, cats: ['recycle', 'ewaste', 'tip'], web: 'https://www.goodwillcolorado.org', phone: '',
      d: 'Donate working electronics, small appliances, and household goods to keep usable items out of the landfill.' },
    { n: 'Free recycling under EPR (active 2026)', who: 'city', free: true, cats: ['recycle', 'city'], web: 'https://coloradosprings.gov/WastelessCOS', phone: '',
      d: 'Colorado’s producer-responsibility program now reimburses participating haulers for curbside recycling, lowering or eliminating recycling fees for residents. Confirm with your hauler.' },
    { n: 'Report illegal dumping', who: 'city', free: true, cats: ['city', 'tip'], web: '', phone: '719-385-2900',
      d: 'See dumping on open land? Call Colorado Springs Code Enforcement to help keep the land clean.' },
    { n: 'Bear-resistant carts (west of I-25)', who: 'tip', free: false, cats: ['tip', 'curbside'], web: '', phone: '',
      d: 'Properties west of I-25 are required to use bear-resistant trash carts. Ask your hauler — several offer them.' },
    { n: 'Pikes Peak Habitat for Humanity ReStore', who: 'nonprofit', free: true, cats: ['bulk', 'recycle', 'tip'], web: 'https://pikespeakhabitat.org/restore/', phone: '719-667-0840',
      d: 'Donate or buy gently used furniture, appliances, building materials, cabinets, and home goods. Locations at 6250 Tutt Blvd. and 411 S. Wahsatch Ave. Proceeds build affordable housing.' },
    { n: 'ARC Thrift Stores', who: 'nonprofit', free: true, cats: ['bulk', 'recycle', 'tip'], web: 'https://www.arcthrift.com', phone: '',
      d: 'Donate clothing, housewares, and furniture — free pickup available for large furniture. Sales fund disability advocacy.' },
    { n: 'Who Gives a Scrap', who: 'nonprofit', free: false, cats: ['recycle', 'tip'], web: 'https://whogivesascrapcolorado.com', phone: '',
      d: 'Creative-reuse center: drop off and shop craft supplies, fabric, art materials, and odd bits that would otherwise be trashed. 810 Arcturus Dr.' },
    { n: 'Food to Power (compost pickup & drop-off)', who: 'nonprofit', free: true, cats: ['yard', 'tip'], web: 'https://foodtopowerco.org/compost', phone: '719-470-2737',
      d: 'Local pay-what-you-can curbside food-scrap pickup and neighborhood drop-off; members get finished compost back twice a year. Accepts food scraps (fruit, veg, coffee filters, loose tea, eggshells, cartons, bread, rice, pasta, cereal), plus cardboard, paper, and leaves.' },
    { n: 'Urban Recycling', who: 'private', free: false, cats: ['bulk', 'recycle', 'ewaste'], web: 'https://www.urbanrecyclingcolo.com', phone: '719-644-6493',
      d: 'Broad drop-off recycler at 3341 N. Cascade Ave. <strong>FREE</strong> for small appliances, limited electronics, auto batteries, artificial Christmas trees, aluminum &amp; misc. metal. <strong>Fees apply</strong> for cardboard, TVs, mattresses &amp; box springs, couches, ottomans, large appliances, microwaves, and freon appliances (fridges, freezers, AC).' },
    { n: 'Koscove Metal (scrap metal)', who: 'private', free: false, cats: ['recycle', 'bulk'], web: 'https://koscovemetal.com', phone: '719-636-3559',
      d: 'Scrap-metal recycling at 431 W. Colorado Ave. for appliances, metal furniture frames, and other metal items; may pay for some loads.' },
    { n: 'Grocery store plastic-film drop-off', who: 'tip', free: true, cats: ['recycle', 'tip'], web: '', phone: '',
      d: 'Plastic bags and film can’t go in curbside recycling. Return them to the bins at the front of King Soopers, Safeway, and most supermarkets.' },
    { n: 'Used motor oil & auto fluids', who: 'tip', free: true, cats: ['hazard', 'tip'], web: '', phone: '',
      d: 'Many auto-parts stores accept used motor oil, oil filters, and antifreeze for free, as does the County HHW facility. Never pour these on the ground or down a drain.' },
    { n: 'Medication & sharps disposal', who: 'tip', free: true, cats: ['hazard', 'tip'], web: '', phone: '',
      d: 'Drop unused medications in pharmacy take-back kiosks or law-enforcement drop boxes — never flush or trash them. Use rigid, labeled containers for needles.' },
    { n: 'Christmas tree recycling', who: 'city', free: true, cats: ['yard', 'tip'], web: '', phone: '',
      d: 'Seasonal free tree-recycling drop-offs each January turn live trees into mulch. Remove all lights, tinsel, and stands first.' },
    { n: 'Christmas Tree Project (donations)', who: 'nonprofit', free: true, cats: ['yard', 'tip'], web: 'https://www.thechristmastreeproject.org', phone: '719-799-6074',
      d: 'Year-round donation of real and artificial Christmas trees, ornaments, and decorations. 4575 Galley Rd. Ste 200E. Lights must be new.' },
    { n: 'Black Forest Slash & Mulch Program', who: 'county', free: false, cats: ['yard', 'city'], web: 'https://www.elpasoco.com', phone: '719-520-7878',
      d: 'Annual El Paso County wildfire-mitigation program (May–September) for slash drop-off and mulch pickup at Shoup &amp; Herring Rd. Fees apply. Tree and bush debris only — no stumps, roots, or pine needles. Maximum 6 ft long, 8 in diameter. Mulch loader available Saturdays.' }
  ];

  var WHO = {
    city: ['City', 'pill city'],
    county: ['County', 'pill county'],
    private: ['Private', 'pill private'],
    tip: ['Tip', 'pill tip'],
    nonprofit: ['Nonprofit', 'pill nonprofit']
  };
  var CAT = {
    curbside: 'Curbside',
    bulk: 'Bulk & large',
    private: 'Private hauler',
    city: 'City/County',
    yard: 'Yard & mulch',
    recycle: 'Recycling drop-off',
    ewaste: 'Electronics & batteries',
    hazard: 'Hazardous waste',
    tip: 'Tip'
  };

  function esc(s) {
    return String(s).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function wireDirectory(root) {
    var grid = root.querySelector('#dirGrid');
    var rowView = root.querySelector('#rowView');
    var meta = root.querySelector('#resultsMeta');
    var none = root.querySelector('#noResults');
    var search = root.querySelector('#dirSearch');
    var chips = [].slice.call(root.querySelectorAll('#chips .chip'));
    var tipsGrid = root.querySelector('#tipsGrid');
    if (!grid || !rowView || !search) return;

    var active = [];
    var view = 'cards';
    var PLACES = R.filter(function (r) { return r.who !== 'tip'; });
    var TIPS = R.filter(function (r) { return r.who === 'tip'; });
    var sortState = { key: 'default', dir: 1 };
    var COLS = [
      { k: 'name', l: 'Resource' },
      { k: 'type', l: 'Type' },
      { k: 'free', l: 'Cost' },
      { k: 'contact', l: 'Contact' },
      { k: 'web', l: 'Website' }
    ];

    function val(r, k) {
      if (k === 'name') return r.n.toLowerCase();
      if (k === 'type') return WHO[r.who][0].toLowerCase();
      if (k === 'free') return r.free ? '0' : '1';
      if (k === 'contact') return r.phone ? r.phone.toLowerCase() : '￿';
      if (k === 'web') return r.web ? r.web.replace(/^https?:\/\/(www\.)?/, '').toLowerCase() : '￿';
      return '';
    }
    function cmp(a, b) {
      if (sortState.key === 'default') {
        if (a.free !== b.free) return a.free ? -1 : 1;
        return a.n.localeCompare(b.n);
      }
      var av = val(a, sortState.key), bv = val(b, sortState.key), d = sortState.dir;
      if (av < bv) return -1 * d;
      if (av > bv) return 1 * d;
      return a.n.localeCompare(b.n);
    }
    function current() {
      var q = search.value.trim().toLowerCase();
      /* Singular→plural variants so "battery" matches "batteries", "tire" matches "tires", etc. */
      var qs = q ? [q] : [];
      if (q.length >= 4) {
        if (q.charAt(q.length - 1) === 'y') qs.push(q.slice(0, -1) + 'ies');
        if (q.charAt(q.length - 1) !== 's') qs.push(q + 's');
      }
      return PLACES.filter(function (r) {
        var mc = active.length === 0 || active.some(function (c) {
          return c === 'free' ? r.free : r.cats.indexOf(c) > -1;
        });
        var hay = (r.n + ' ' + r.d + ' ' + r.cats.join(' ') + ' ' + (r.free ? 'free' : '')).toLowerCase();
        return mc && (qs.length === 0 || qs.some(function (qv) { return hay.indexOf(qv) > -1; }));
      }).sort(cmp);
    }
    function webLink(r) {
      if (!r.web) return '';
      var pdf = r.web.indexOf('.pdf') > -1;
      var label = pdf ? 'View directory (PDF)' : 'Visit website';
      return '<a href="' + escAttr(r.web) + '" target="_blank" rel="noopener noreferrer">' + label +
        '<span class="visually-hidden"> for ' + esc(r.n) + (pdf ? ' (PDF,' : ' (') + ' opens in new tab)</span></a>';
    }
    function renderCards(list) {
      grid.innerHTML = list.map(function (r) {
        var w = WHO[r.who];
        var cats = r.cats.map(function (c) { return CAT[c]; }).filter(Boolean).join(' · ');
        return '<article class="res' + (r.free ? ' is-free' : '') + '">' +
          '<div class="meta">' + (r.free ? '<span class="pill free">Free</span>' : '') +
          '<span class="' + w[1] + '">' + w[0] + '</span></div>' +
          '<h3>' + esc(r.n) + '</h3><p>' + r.d + '</p>' +
          '<div class="row">' + (r.phone ? '<span class="contact">☎ ' + esc(r.phone) + '</span>' : '') +
          (r.web ? webLink(r) : '') + '</div>' +
          '<p class="cats">' + cats + '</p></article>';
      }).join('');
    }
    function renderRows(list) {
      var head = COLS.map(function (col) {
        var s = (sortState.key === col.k) ? (sortState.dir === 1 ? 'ascending' : 'descending') : 'none';
        var arr = (sortState.key === col.k) ? (sortState.dir === 1 ? '▲' : '▼') : '⇅';
        return '<th scope="col" aria-sort="' + s + '"><button type="button" class="th-sort" data-key="' +
          col.k + '">' + col.l + ' <span class="arr" aria-hidden="true">' + arr + '</span></button></th>';
      }).join('');
      rowView.innerHTML = '<div class="dir-table-wrap"><table class="dir-table">' +
        '<caption>Recycling and waste resources. Click a column heading to sort; default shows free options first, then alphabetical.</caption>' +
        '<thead><tr>' + head + '</tr></thead><tbody>' +
        list.map(function (r) {
          var w = WHO[r.who];
          var cats = r.cats.map(function (c) { return CAT[c]; }).filter(Boolean).join(', ');
          return '<tr><th scope="row" class="name">' + esc(r.n) +
            '<br><span style="font-weight:400;color:var(--ink-soft);font-size:.85rem">' + cats + '</span></th>' +
            '<td><span class="' + w[1] + '">' + w[0] + '</span></td>' +
            '<td>' + (r.free ? '<span class="pill free">Free</span>' : 'Varies') + '</td>' +
            '<td>' + (r.phone ? esc(r.phone) : '—') + '</td>' +
            '<td>' + (r.web ? webLink(r) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    function render() {
      var list = current(), empty = list.length === 0;
      if (view === 'cards') renderCards(list); else renderRows(list);
      root.querySelector('#cardView').hidden = empty || view !== 'cards';
      rowView.hidden = empty || view !== 'rows';
      none.hidden = !empty;
      var fc = list.filter(function (r) { return r.free; }).length;
      meta.textContent = list.length + (list.length === 1 ? ' resource' : ' resources') +
        ' shown (' + fc + ' free) · ' + (view === 'cards' ? 'card view' : 'row view') +
        (active.length ? ' · filtered' : '') +
        (search.value.trim() ? ' · matching “' + search.value.trim() + '”' : '');
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.dataset.filter;
        if (f === 'all') {
          active = [];
          chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.filter === 'all')); });
        } else {
          var on = c.getAttribute('aria-pressed') === 'true';
          c.setAttribute('aria-pressed', String(!on));
          if (on) active = active.filter(function (x) { return x !== f; });
          else active.push(f);
          root.querySelector('.chip[data-filter="all"]').setAttribute('aria-pressed', String(active.length === 0));
        }
        render();
      });
    });
    root.querySelector('#viewCards').addEventListener('click', function () {
      view = 'cards';
      this.setAttribute('aria-pressed', 'true');
      root.querySelector('#viewRows').setAttribute('aria-pressed', 'false');
      render();
    });
    root.querySelector('#viewRows').addEventListener('click', function () {
      view = 'rows';
      this.setAttribute('aria-pressed', 'true');
      root.querySelector('#viewCards').setAttribute('aria-pressed', 'false');
      render();
    });
    rowView.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.th-sort') : null;
      if (!b) return;
      var k = b.getAttribute('data-key');
      if (sortState.key === k) {
        if (sortState.dir === 1) { sortState.dir = -1; }
        else { sortState.key = 'default'; sortState.dir = 1; }
      } else { sortState.key = k; sortState.dir = 1; }
      render();
    });
    search.addEventListener('input', render);

    if (tipsGrid) {
      tipsGrid.innerHTML = TIPS.map(function (t) {
        return '<div class="tip-box">' +
          (t.free ? '<span class="pill free">Free</span>' : '<span class="pill tip">Tip</span>') +
          '<h4>' + esc(t.n) + '</h4><p>' + t.d + '</p></div>';
      }).join('');
    }
    render();
  }

  /* ---------- How to Sort ---------- */

  var BINS = [
    { cls: 'recycle', icon: '♻️', title: 'Curbside recycling',
      yes: ['Paper, junk mail, magazines', 'Cardboard, flattened (max ~2×2 ft)', 'Rigid plastics #1–#7 (bottles, jugs, tubs)', 'Metal cans (steel & aluminum)', 'Clean glass bottles & jars'],
      no: ['Plastic bags & film (jam the sorter)', 'Foam / Styrofoam', 'Food-soiled items, greasy pizza boxes', 'Ceramics, drinking glasses, lightbulbs'],
      where: 'Empty and rinse first. Single-stream — all together in one cart.',
      kw: 'paper cardboard box plastic bottle jug can aluminum steel glass jar magazine mail newspaper recycle recycling' },
    { cls: 'trash', icon: '🗑️', title: 'Landfill trash',
      yes: ['Food-soiled packaging & greasy boxes', 'Foam and plastic film (unless store drop-off)', 'Diapers, hygiene products', 'Broken ceramics & drinking glass'],
      no: ['Batteries (fire risk!)', 'Electronics (banned from CO landfills)', 'Paint, chemicals, oil', 'Anything still usable — donate it'],
      where: 'Weekly curbside cart from your chosen private hauler.',
      kw: 'trash garbage diaper foam styrofoam tissue food waste landfill greasy pizza' },
    { cls: 'ewaste', icon: '💻', title: 'Electronics (e-waste)',
      yes: ['TVs, monitors, computers, laptops', 'Tablets, phones, printers', 'Cables, keyboards, accessories'],
      no: ['Never in curbside trash or recycling', 'Banned from Colorado landfills since 2013'],
      where: 'Drop at E-Tech Recyclers, Best Buy, or the County HHW facility (small/CRT TVs). Reset devices to factory settings first. See the Directory tab.',
      kw: 'electronics e-waste ewaste tv television monitor computer laptop tablet phone cellphone printer cable keyboard charger' },
    { cls: 'ewaste', icon: '🔋', title: 'Batteries',
      yes: ['Single-use AA/AAA/9V', 'Rechargeable & lithium', 'Car / auto batteries', 'Button cells'],
      no: ['Never in curbside trash or recycling', 'Loose lithium batteries can spark fires'],
      where: 'County HHW facility (free), Batteries Plus, or Wine Punts (auto batteries). See the Directory tab.',
      kw: 'battery batteries aa aaa lithium rechargeable car auto button cell 9v power' },
    { cls: 'hazard', icon: '☠️', title: 'Household hazardous waste',
      yes: ['Paint, stain, solvents', 'Pesticides, fertilizer, antifreeze', 'Cleaning chemicals, aerosols', 'Fluorescent bulbs (mercury), smoke alarms'],
      no: ['Never down the drain or in any cart'],
      where: 'FREE at El Paso County HHW Facility, 3255 Akers Dr. Bring photo ID. See the Directory tab.',
      kw: 'paint stain solvent pesticide fertilizer antifreeze chemical aerosol fluorescent bulb light mercury smoke alarm hazardous oil cleaner' },
    { cls: 'organics', icon: '🌿', title: 'Yard waste & food scraps',
      yes: ['Branches, leaves, grass clippings', 'Fruit & vegetable scraps', 'Coffee grounds, eggshells'],
      no: ['Not accepted in most curbside carts yet', 'Meat/dairy not ideal for backyard bins'],
      where: 'Compost at home, drop at Rocky Top Resources, or grab free City mulch. See the Directory tab.',
      kw: 'yard waste leaves grass branches compost food scraps organic mulch wood chips garden tree leaf' },
    { cls: 'recycle', icon: '🧊', title: 'Large appliances',
      yes: ['Fridges & freezers (refrigerant)', 'Washers, dryers, stoves', 'Microwaves, dishwashers'],
      no: ['Won’t fit in curbside carts'],
      where: 'Schedule bulk pickup with your hauler, or take fridges/freezers to the CS Landfill (1010 Blaney Rd). See the Directory tab.',
      kw: 'appliance fridge refrigerator freezer washer dryer stove oven microwave dishwasher metal bulky large' },
    { cls: 'recycle', icon: '🛒', title: 'Plastic bags & film',
      yes: ['Grocery & produce bags', 'Bread bags, dry-cleaning film', 'Bubble wrap, air pillows'],
      no: ['Never in the curbside recycling cart', 'They tangle and jam the sorting machines'],
      where: 'Return to grocery-store film drop-off bins at the front of most supermarkets.',
      kw: 'plastic bag film grocery produce bread bubble wrap shrink wrap store drop off' }
  ];

  function wireSortingGuide(root) {
    var sortGrid = root.querySelector('#sortGrid');
    var sortNone = root.querySelector('#sortNone');
    var sortSearch = root.querySelector('#sortSearch');
    var sortMeta = root.querySelector('#sortMeta');
    if (!sortGrid || !sortSearch) return;

    function renderBins() {
      var q = sortSearch.value.trim().toLowerCase();
      var list = BINS.filter(function (b) { return q === '' || (b.title + ' ' + b.kw).toLowerCase().indexOf(q) > -1; });
      sortGrid.innerHTML = list.map(function (b) {
        return '<article class="bin ' + b.cls + '"><h3><span aria-hidden="true">' + b.icon + '</span> ' + b.title + '</h3>' +
          '<p class="yes"><b>Goes here:</b></p><ul>' + b.yes.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' +
          '<p class="no"><b>Keep out:</b></p><ul>' + b.no.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' +
          '<p class="where">' + b.where + '</p></article>';
      }).join('');
      sortNone.hidden = list.length > 0;
      sortGrid.hidden = list.length === 0;
      sortMeta.textContent = q ? (list.length + (list.length === 1 ? ' category' : ' categories') +
        ' matching “' + sortSearch.value.trim() + '”') : '';
    }
    sortSearch.addEventListener('input', renderBins);
    renderBins();
  }

})(Drupal, once);
