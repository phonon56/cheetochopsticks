/**
 * @file
 * The Dais — Civic Calendar (Drupal port).
 *
 * Wrapped in Drupal.behaviors with once() so the page works inside a Drupal
 * theme and survives AJAX re-renders without double-binding listeners.
 *
 * The page is a single-instance microsite mounted at /calendar; functions
 * still reach into the global document for #search, #drawer, etc., because
 * only one .dais-cal exists per page. If multiple instances are ever needed
 * the queries should be scoped to `root`.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.daisCalendar = {
    attach: function (context) {
      once('dais-cal', '.dais-cal[data-dais-root]', context).forEach(function (root) {
        initCalendar(root);
      });
    }
  };

  function initCalendar(root) {

/* ============================================================
   The Dais — Civic Calendar.  UX modeled on FullCalendar
   (month / week / day + view switch + prev·next·today),
   styled in The Dais theme. Data shapes drawn from a methodical
   pass over every city + county microsite in cheetochopsticks.
   Records pulled / modeled 2026-05-20.
   ============================================================ */

const CATS = {
  alert:     { label:'Alert',          color:'var(--c-alert)',     text:'#ff8c8c' },
  book:      { label:'Book page',      color:'var(--c-book)',      text:'#3fd0c9' },
  recurring: { label:'Recurring event',color:'var(--c-recurring)', text:'var(--gold-light)' },
  news:      { label:'News',           color:'var(--c-news)',      text:'#8ec6ff' },
  project:   { label:'Project',        color:'var(--c-project)',   text:'#b6a4ff' },
  notice:    { label:'Public notice',  color:'var(--c-notice)',    text:'#ffb46b' },
};

// Sources grouped by jurisdiction — each maps to a real civic system found in the repo.
const SOURCES = {
  legistar:   { label:'Legistar — meetings',     group:'City',            url:'https://coloradosprings.legistar.com/Calendar.aspx' },
  accela:     { label:'Accela — permits/licenses',group:'City',           url:'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Building' },
  procurement:{ label:'Procurement — bids',       group:'City',            url:'https://coloradosprings.gov/procurement-services/page/list-open-solicitations' },
  policedata: { label:'CSPD open data',           group:'City',            url:'https://policedata.coloradosprings.gov' },
  parks:      { label:'Parks & Recreation',       group:'City',            url:'https://parks.coloradosprings.gov' },
  csu:        { label:'CSU — utilities',          group:'City',            url:'https://www.csu.org' },
  cosgov:     { label:'coloradosprings.gov',      group:'City',            url:'https://coloradosprings.gov' },
  epc:        { label:'EPC dev plan review',      group:'County',          url:'https://epcdevplanreview.com/Public/ActiveList/' },
  bocc:       { label:'Board of County Comm.',    group:'County',          url:'https://bocc.elpasoco.com' },
  pprbd:      { label:'PPRBD — building permits', group:'County',          url:'https://www.pprbd.org' },
  assessor:   { label:'County Assessor',          group:'County',          url:'https://assessor.elpasoco.com' },
  ldc:        { label:'Land Development Code',     group:'County',          url:'https://elpasocountyldc.konveio.com' },
  health:     { label:'EPC Public Health',        group:'County',          url:'https://www.elpasocountyhealth.org' },
  opendata:   { label:'EPC open-data hub',        group:'County',          url:'https://opendata-elpasoco.hub.arcgis.com' },
  pproem:     { label:'Pikes Peak OEM',           group:'Regional & State',url:'https://pproem.com' },
  ppacg:      { label:'PPACG — regional planning',group:'Regional & State',url:'https://www.ppacg.org' },
  ppld:       { label:'Pikes Peak Library Dist.', group:'Regional & State',url:'https://ppld.org' },
  codot:      { label:'CDOT',                     group:'Regional & State',url:'https://www.codot.gov' },
};

const d = (m,day,h=null,min=0) => ({ y:2026, m, day, h, min });

const EVENTS = [
  /* ── RECURRING / MEETINGS — real Legistar + BoCC records ── */
  { id:'leg-ws-0511', cat:'recurring', src:'legistar', title:'City Council Work Session', date:d(5,11,9,0), end:{h:12}, loc:'Council Chambers', dept:'City Council',
    summary:'Council reviews upcoming agenda items in an informal session. No formal votes, but this is where the real discussion happens before the regular meeting.',
    link:'https://coloradosprings.legistar.com/MeetingDetail.aspx?ID=1351465', linkLabel:'Meeting details', ical:'https://coloradosprings.legistar.com/View.ashx?M=IC&ID=1351465' },
  { id:'leg-cc-0512', cat:'recurring', src:'legistar', title:'City Council Regular Meeting', date:d(5,12,9,0), end:{h:13}, loc:'Council Chambers', dept:'City Council',
    summary:'The formal Council meeting where ordinances are voted on. Public comment is available in person and in writing. Agenda and accessible agenda are both posted.',
    link:'https://coloradosprings.legistar.com/MeetingDetail.aspx?ID=1351467', linkLabel:'Agenda & details', ical:'https://coloradosprings.legistar.com/View.ashx?M=IC&ID=1351467', connected:['epc-fontaine','notice-rfp-streets','proj-rezone-nevada'] },
  { id:'leg-pc-0513', cat:'recurring', src:'legistar', title:'City Planning Commission', date:d(5,13,9,0), end:{h:13}, loc:'2880 International Cir., 2nd Floor Hearing Room', dept:'Planning Commission',
    summary:'The Commission reviews zoning, subdivision and land-use applications before they reach Council. Many projects on this calendar pass through here first.',
    link:'https://coloradosprings.legistar.com/MeetingDetail.aspx?ID=1349677', linkLabel:'Meeting details', ical:'https://coloradosprings.legistar.com/View.ashx?M=IC&ID=1349677', connected:['epc-otero','epc-tinyhome','book-permit'] },
  { id:'leg-liq-0515', cat:'recurring', src:'legistar', title:'Liquor & Beer License Hearings', date:d(5,15,9,0), end:{h:11}, loc:'Division 2, Municipal Court Building', dept:'Municipal Court',
    summary:'Hearings on new and renewed liquor and beer licenses. Nearby residents can speak for or against an application.',
    link:'https://coloradosprings.legistar.com/MeetingDetail.aspx?ID=1345282', linkLabel:'Agenda & details', ical:'https://coloradosprings.legistar.com/View.ashx?M=IC&ID=1345282', connected:['accela-liquor'] },
  { id:'boco-0521', cat:'recurring', src:'bocc', title:'Board of County Commissioners', date:d(5,21,9,0), end:{h:12}, loc:'Centennial Hall, 200 S. Cascade Ave', dept:'El Paso County',
    summary:'Weekly BoCC meeting. County land-use decisions, budget items and public hearings. Public comment accepted in person and online.',
    link:'https://bocc.elpasoco.com', linkLabel:'County agenda', connected:['proj-cresthill','epc-cathedral'] },
  { id:'leg-ws-0526', cat:'recurring', src:'legistar', title:'City Council Work Session', date:d(5,26,9,0), end:{h:12}, loc:'Council Chambers', dept:'City Council',
    summary:'Work session preceding the regular meeting. Briefings and discussion only.',
    link:'https://coloradosprings.legistar.com/MeetingDetail.aspx?ID=1351466', linkLabel:'Meeting details', ical:'https://coloradosprings.legistar.com/View.ashx?M=IC&ID=1351466' },
  { id:'leg-cc-0526', cat:'recurring', src:'legistar', title:'City Council Regular Meeting', date:d(5,26,9,0), end:{h:13}, loc:'Council Chambers', dept:'City Council',
    summary:'Next regular Council meeting. Agenda posts roughly a week ahead. Livestreamed; written comment accepted in advance.',
    link:'https://coloradosprings.legistar.com/MeetingDetail.aspx?ID=1351464', linkLabel:'Meeting details', ical:'https://coloradosprings.legistar.com/View.ashx?M=IC&ID=1351464' },
  { id:'ppld-board-0518', cat:'recurring', src:'ppld', title:'Library District Board Meeting', date:d(5,18,17,30), end:{h:19}, loc:'Penrose Library, 20 N. Cascade', dept:'Pikes Peak Library District',
    summary:'Monthly board meeting for the regional library district. Budget, branch hours and programming decisions. Open to the public.',
    link:'https://ppld.org', linkLabel:'Library District' },
  { id:'bza-0520', cat:'recurring', src:'cosgov', title:'Board of Zoning Appeals', date:d(5,20,8,30), end:{h:11}, loc:'City Administration Building', dept:'Board of Zoning Appeals',
    summary:'Hears variance requests — when a property owner asks to deviate from a zoning rule, like a setback. Neighbors can comment.',
    link:'https://coloradosprings.gov/planning-and-development', linkLabel:'Planning & Development', connected:['proj-variance-hillside'] },

  /* ── PROJECT — EPC dev plan review (real, parcel-connected) ── */
  { id:'epc-storage', cat:'project', src:'epc', title:'Humphrey Platte Ave Self Storage', date:d(5,20), allday:true, file:'PPR2418', applicant:'RMG', parcel:'5418000075', dept:'EPC Planning & Community Dev',
    summary:'A self-storage development in planning review. "Under review" means staff and referral agencies are checking the site plan against code — the window where public comment carries the most weight.',
    link:'https://epcdevplanreview.com/Public/ProjectDetails/197797', linkLabel:'Project file PPR2418' },
  { id:'epc-cathedral', cat:'project', src:'epc', title:'Estates at Cathedral Pines — County Access', date:d(5,18), allday:true, file:'CA262', applicant:'Villagree Development LLC', parcel:'6200000411', loc:'Winslow Dr, 80908', dept:'EPC Planning & Community Dev',
    summary:'A county-access request tied to the Cathedral Pines estates area. Decides how a parcel connects to the public road network.',
    link:'https://epcdevplanreview.com/Public/ProjectDetails/211814', linkLabel:'Project file CA262', connected:['boco-0521'] },
  { id:'epc-otero', cat:'project', src:'epc', title:'10090 Otero Ave — ALQ Permanent Occupancy', date:d(5,13), allday:true, file:'AL2410', applicant:'KGM2 Construction', parcel:'6228004013', dept:'EPC Planning & Community Dev',
    summary:'Request to allow an Accessory Living Quarters unit to be lived in permanently. Plain version: someone wants the casita on their lot to be a legal full-time residence.',
    link:'https://epcdevplanreview.com/Public/ProjectDetails/196677', linkLabel:'Project file AL2410', connected:['leg-pc-0513','book-permit'] },
  { id:'epc-fontaine', cat:'project', src:'epc', title:'11060 Fontaine Blvd — Grand Mountain PPR Amendment', date:d(5,22), allday:true, file:'PPR2611', applicant:'R. Austin Architect', parcel:'5513301002', dept:'EPC Planning & Community Dev',
    summary:'An amendment to an approved preliminary plan in the Grand Mountain area. Amendments change something already approved — worth watching if you live nearby.',
    link:'https://epcdevplanreview.com/Public/ProjectDetails/211747', linkLabel:'Project file PPR2611', connected:['leg-cc-0512'] },
  { id:'epc-tinyhome', cat:'project', src:'epc', title:'1219 Forest Road — Tiny Home', date:d(5,14), allday:true, file:'THSP251', applicant:'Morley Enterprises', parcel:'6503301005', loc:'1219 Forest Rd', dept:'EPC Planning & Community Dev',
    summary:'A tiny-home siting permit. Reviews whether a tiny dwelling meets setback, septic and access rules for the lot.',
    link:'https://epcdevplanreview.com/Public/ProjectDetails/203115', linkLabel:'Project file THSP251', connected:['leg-pc-0513'] },
  { id:'epc-cafe', cat:'project', src:'epc', title:'13596 Front St — Retail to Café Change of Use', date:d(5,27), allday:true, file:'COM268', applicant:'308 LLC', parcel:'3206410026', loc:'13596 Front St', dept:'EPC Planning & Community Dev',
    summary:'A change-of-use application turning a retail space into a café. Change of use checks parking, occupancy and code for the new purpose.',
    link:'https://epcdevplanreview.com/Public/ProjectDetails/211535', linkLabel:'Project file COM268' },

  /* ── PROJECT — capital / hearings / districts (from whatsBeingBuilt schema) ── */
  { id:'proj-rezone-nevada', cat:'project', src:'cosgov', title:'Downtown Rezoning — 400 block of Nevada', date:d(5,12), allday:true, dept:'City Planning Commission',
    summary:'A rezoning that would change what can be built on the 400 block of Nevada Ave. Heard at Planning Commission before going to Council.',
    link:'https://coloradosprings.gov/planning-and-development', linkLabel:'Planning hearing', connected:['leg-cc-0512'] },
  { id:'proj-cresthill', cat:'project', src:'bocc', title:'Cresthill Metro District — Formation Filing', date:d(5,21), allday:true, dept:'El Paso County (BoCC review)',
    summary:'A developer is asking the County to create a metro district — a taxing entity that funds infrastructure for a new development and bills future homeowners. Under BoCC review.',
    link:'https://bocc.elpasoco.com', linkLabel:'BoCC filing', connected:['boco-0521'] },
  { id:'proj-variance-hillside', cat:'project', src:'cosgov', title:'Variance Request — Hillside Setback', date:d(5,20), allday:true, dept:'Board of Zoning Appeals',
    summary:'A property owner is requesting relief from the hillside setback rule. Heard at the Board of Zoning Appeals.',
    link:'https://coloradosprings.gov/planning-and-development', linkLabel:'BZA calendar', connected:['bza-0520'] },
  { id:'proj-union', cat:'project', src:'cosgov', title:'Union Blvd Corridor Improvements', date:d(5,11), allday:true, span:21, dept:'City Public Works',
    summary:'Roadway reconstruction and signal upgrades on Union Blvd (Austin Bluffs–Maizeland), funded by the 2C roads program. Expect lane restrictions during active phases.',
    link:'https://coloradosprings.gov/public-works', linkLabel:'Public Works' },
  { id:'proj-pprbd-permit', cat:'project', src:'pprbd', title:'New Single-Family Permit Issued — Banning Lewis', date:d(5,19), allday:true, parcel:'5413000228', dept:'Pikes Peak Regional Building Dept',
    summary:'A building permit was issued for new home construction. PPRBD is the regional authority that reviews structural plans and inspects the build.',
    link:'https://www.pprbd.org', linkLabel:'PPRBD permit search' },

  /* ── PUBLIC NOTICE — procurement, hearings, code, licensing ── */
  { id:'notice-rfp-streets', cat:'notice', src:'procurement', title:'RFP — Arterial Street Overlay 2026', date:d(5,28,16,0), end:{h:17}, dept:'Procurement Services',
    summary:'An open solicitation: the City is taking bids to repave a set of arterial streets. The deadline is the moment bids stop being accepted.',
    link:'https://coloradosprings.gov/procurement-services/page/list-open-solicitations', linkLabel:'Open solicitations', connected:['leg-cc-0512','proj-union'] },
  { id:'notice-rfp-fleet', cat:'notice', src:'procurement', title:'IFB — Fleet Vehicle Replacement', date:d(5,15,14,0), end:{h:15}, dept:'Procurement Services',
    summary:'Invitation for Bid to supply replacement fleet vehicles. Sealed bids open on the closing date.',
    link:'https://coloradosprings.gov/procurement-services/page/list-open-solicitations', linkLabel:'Open solicitations' },
  { id:'notice-hearing-zone', cat:'notice', src:'cosgov', title:'Public Hearing Notice — Rezoning, Powers Corridor', date:d(5,19), allday:true, parcel:'6401303008', dept:'Planning & Development',
    summary:'Legal notice that a rezoning will be heard. Posting the notice formally starts the public-comment clock for affected property owners.',
    link:'https://coloradosprings.gov/planning-and-development', linkLabel:'Planning & Development' },
  { id:'notice-budget', cat:'notice', src:'cosgov', title:'Public Comment — 2027 Budget Open Period', date:d(5,25), allday:true, span:5, dept:'City Finance',
    summary:'The window where residents can weigh in on next year\'s city budget before it is adopted. Comments accepted online or in person.',
    link:'https://coloradosprings.gov/budget', linkLabel:'City budget' },
  { id:'notice-ldc', cat:'notice', src:'ldc', title:'Land Development Code — Public Comment Window', date:d(5,17), allday:true, span:7, dept:'El Paso County Planning',
    summary:'The County is taking public comment on changes to the Land Development Code (the rulebook for what can be built where). Comment via the Konveio review tool.',
    link:'https://elpasocountyldc.konveio.com', linkLabel:'LDC review tool' },
  { id:'accela-liquor', cat:'notice', src:'accela', title:'New Liquor License Application Posted', date:d(5,14), allday:true, dept:'City Clerk — Licensing',
    summary:'A new liquor license application was filed in the Accela licensing portal. Posting begins the notice period before the hearing.',
    link:'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Licensing', linkLabel:'Accela — Licensing', connected:['leg-liq-0515'] },
  { id:'health-permit', cat:'notice', src:'health', title:'Food-Service Inspection Results Posted', date:d(5,23), allday:true, dept:'El Paso County Public Health',
    summary:'Routine restaurant inspection results were published. Useful if you want to check a specific establishment before visiting.',
    link:'https://www.elpasocountyhealth.org/licenses-permits-inspections-water-testing/', linkLabel:'Inspections & permits' },

  /* ── ALERT — operational, short-lived ── */
  { id:'alert-water', cat:'alert', src:'csu', title:'Stage 1 Water Watch in effect', date:d(5,20), allday:true, dept:'Colorado Springs Utilities',
    summary:'A voluntary conservation advisory. Nothing is mandatory yet, but the utility is asking residents to ease back on outdoor watering.',
    link:'https://www.csu.org', linkLabel:'CSU advisories' },
  { id:'alert-closure', cat:'alert', src:'cosgov', title:'Cascade Ave lane closure', date:d(5,21,7,0), end:{h:17}, loc:'Cascade Ave, Bijou–Platte', dept:'Public Works',
    summary:'Temporary lane closure for utility work. Expect delays during daytime hours; the road reopens by evening.',
    link:'https://coloradosprings.gov/public-works', linkLabel:'Public Works' },
  { id:'alert-burn', cat:'alert', src:'pproem', title:'Red Flag fire-weather warning', date:d(5,23), allday:true, dept:'Pikes Peak OEM',
    summary:'High wind and low humidity raise wildfire risk. Open burning is suspended for the day. Emergency management issues these regionally.',
    link:'https://pproem.com', linkLabel:'Emergency management' },
  { id:'alert-i25', cat:'alert', src:'codot', title:'I-25 South Gap — overnight closures', date:d(5,24,21,0), end:{h:23}, loc:'I-25, Monument–Castle Rock', dept:'Colorado DOT',
    summary:'Overnight lane closures for the ongoing I-25 South Gap widening. Plan extra time if traveling north late.',
    link:'https://www.codot.gov', linkLabel:'CDOT travel info' },

  /* ── NEWS — releases ── */
  { id:'news-park', cat:'news', src:'parks', title:'New trailhead opens at Stratton Open Space', date:d(5,16), allday:true, dept:'Parks, Recreation & Cultural Services',
    summary:'The City announced a new trailhead with parking and accessible paths. A short read; mainly relevant if you use that open space.',
    link:'https://parks.coloradosprings.gov', linkLabel:'Parks news' },
  { id:'news-grant', cat:'news', src:'cosgov', title:'City awarded federal transit grant', date:d(5,18), allday:true, dept:'Mountain Metro Transit',
    summary:'A grant announcement for transit improvements. Sets up future projects but no immediate change to riders.',
    link:'https://coloradosprings.gov/mountain-metro-transit', linkLabel:'Transit news' },
  { id:'news-crime', cat:'news', src:'policedata', title:'April crime dashboard updated', date:d(5,15), allday:true, dept:'Colorado Springs Police Dept',
    summary:'CSPD refreshed its open crime data for April. The dashboard lets you filter incidents by neighborhood and type.',
    link:'https://policedata.coloradosprings.gov', linkLabel:'CSPD open data' },
  { id:'news-rtp', cat:'news', src:'ppacg', title:'Regional Transportation Plan — public input opens', date:d(5,29), allday:true, dept:'PPACG',
    summary:'The regional planning council opened public input on the long-range transportation plan. Shapes road and transit priorities for years.',
    link:'https://www.ppacg.org', linkLabel:'PPACG planning' },
  { id:'news-opendata', cat:'news', src:'opendata', title:'County parcel & zoning layers refreshed', date:d(5,17), allday:true, dept:'El Paso County GIS', parcel:'5418000075',
    summary:'The County\'s open-data hub published an updated parcel and zoning layer. This is the GIS feed a "search by parcel" feature would draw on to resolve an address to its zoning, owner and overlapping districts.',
    link:'https://opendata-elpasoco.hub.arcgis.com', linkLabel:'EPC open-data hub' },

  /* ── BOOK PAGE — reference guides (Drupal "book" content type) ── */
  { id:'book-cora', cat:'book', src:'cosgov', title:'How to file a CORA records request', date:d(5,12), allday:true, dept:'City Clerk',
    summary:'A reference guide, not an event — pinned because the CORA window matters this month. Walks you through requesting public records step by step.',
    link:'https://coloradosprings.gov/cora', linkLabel:'CORA guide' },
  { id:'book-permit', cat:'book', src:'cosgov', title:'Residential permit application guide', date:d(5,19), allday:true, dept:'Planning & Development',
    summary:'Reference page explaining what a homeowner needs before applying for a building permit. Connects to the project records on this calendar.',
    link:'https://coloradosprings.gov/planning-and-development', linkLabel:'Permit guide', connected:['epc-tinyhome','epc-otero','proj-pprbd-permit'] },
  { id:'book-assessor', cat:'book', src:'assessor', title:'Understanding your property assessment', date:d(5,22), allday:true, dept:'El Paso County Assessor',
    summary:'Reference guide on how the County values your parcel and how to appeal. The Assessor is where a parcel number resolves to an owner and value.',
    link:'https://assessor.elpasoco.com', linkLabel:'Assessor' },
  { id:'book-boards', cat:'book', src:'cosgov', title:'Apply: Boards, Commissions & Committees', date:d(5,27), allday:true, dept:'City Clerk',
    summary:'Reference guide on joining a city board such as the Planning Commission. Lists current openings and the application cycle.',
    link:'https://coloradosprings.gov/apply-boards-commissions-committees', linkLabel:'Boards & commissions' },
];

/* ── State ── */
const TODAY = new Date(2026,4,20);
let view = 'month';
let cursor = new Date(2026,4,20);
let activeCats = new Set(Object.keys(CATS));
let activeSrcs = new Set(Object.keys(SOURCES));
let query = '';
const byId = Object.fromEntries(EVENTS.map(e=>[e.id,e]));

/* ── Date helpers ── */
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WDFull={Sun:'Sunday',Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday'};

/* HTML escaping for user-visible values that we inject into innerHTML.
   escText for element bodies, escAttr for attribute values. */
function escText(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function evtDate(e){return new Date(e.date.y,e.date.m-1,e.date.day, e.date.h||0, e.date.min||0);}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function fmtHour(h){const ap=h>=12?'PM':'AM';let hh=h%12;if(hh===0)hh=12;return hh+(ap==='AM'?'a':'p');}
function fmtTime(h,m){const ap=h>=12?'PM':'AM';let hh=h%12;if(hh===0)hh=12;return hh+(m?':'+String(m).padStart(2,'0'):'')+' '+ap;}

/* spans: an event can occupy several days (allday + span) */
function occupiesDay(e,date){
  const s=evtDate(e);
  if(e.span){const end=new Date(s);end.setDate(end.getDate()+e.span-1);return date>=new Date(s.getFullYear(),s.getMonth(),s.getDate())&&date<=new Date(end.getFullYear(),end.getMonth(),end.getDate());}
  return sameDay(s,date);
}
function matchesQuery(e){
  if(!query)return true;
  const hay=[e.title,e.dept,e.loc,e.summary,e.parcel,e.file,SOURCES[e.src].label].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(query.toLowerCase());
}
function passFilter(e){
  return activeCats.has(e.cat) && activeSrcs.has(e.src) && matchesQuery(e);
}
// Faceted counts: each axis counts events that pass the OTHER axis + search,
// so the numbers always reflect what would actually appear on the calendar.
function catCount(k){return EVENTS.filter(e=>e.cat===k && activeSrcs.has(e.src) && matchesQuery(e)).length;}
function srcCount(k){return EVENTS.filter(e=>e.src===k && activeCats.has(e.cat) && matchesQuery(e)).length;}
function eventsForDay(date){return EVENTS.filter(passFilter).filter(e=>occupiesDay(e,date)).sort((a,b)=>{
  const aa=a.allday?-1:(a.date.h*60+(a.date.min||0)); const bb=b.allday?-1:(b.date.h*60+(b.date.min||0)); return aa-bb;});}

/* ── Render: filter rail ──
   · Toggle a row     → flip just that filter on/off (hides/shows its events).
   · Activate "only"  → isolate to that one filter and re-enable the other axis,
                        so you immediately see exactly that source/type.
   · Rows are <button role="checkbox"> so Tab + Space/Enter toggle them. */
function makeFilterRow({key,label,dotColor,count,active,onToggle,onOnly,isSrc}){
  const el=document.createElement('button');
  el.type='button';
  el.setAttribute('role','checkbox');
  el.setAttribute('aria-checked',String(!!active));
  el.className='filter'+(isSrc?' src-filter':'')+(count===0?' zero':'');
  const safeLabel=String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  el.innerHTML=`<span class="dot" aria-hidden="true"${dotColor?` style="background:${dotColor}"`:''}></span>`+
    `<span class="label">${safeLabel}</span>`+
    `<span class="only-btn" role="button" tabindex="0" aria-label="Show only ${safeLabel.replace(/"/g,'&quot;')}">only</span>`+
    `<span class="count" aria-label="${count} record${count===1?'':'s'}">${count}</span>`;
  el.addEventListener('click',(ev)=>{
    if(ev.target.closest('.only-btn')){ev.stopPropagation();onOnly();return;}
    onToggle();
  });
  el.addEventListener('keydown',(ev)=>{
    if((ev.key===' '||ev.key==='Enter')&&!ev.target.closest('.only-btn')){
      ev.preventDefault();onToggle();
    }
  });
  const only=el.querySelector('.only-btn');
  only.addEventListener('keydown',(ev)=>{
    if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();ev.stopPropagation();onOnly();}
  });
  return el;
}
function renderRail(){
  const cf=document.getElementById('catFilters'); cf.innerHTML='';
  Object.entries(CATS).forEach(([k,c])=>{
    cf.appendChild(makeFilterRow({
      key:k, label:c.label, dotColor:c.color, count:catCount(k), active:activeCats.has(k),
      onToggle:()=>{
        if(activeCats.has(k)) activeCats.delete(k);
        else { activeCats.add(k); if(activeSrcs.size===0) activeSrcs=new Set(Object.keys(SOURCES)); }
        renderRail();render();
      },
      onOnly:()=>{activeCats=new Set([k]);activeSrcs=new Set(Object.keys(SOURCES));renderRail();render();},
    }));
  });
  const sf=document.getElementById('srcFilters'); sf.innerHTML='';
  const groups={};
  Object.entries(SOURCES).forEach(([k,s])=>{(groups[s.group]=groups[s.group]||[]).push([k,s]);});
  Object.entries(groups).forEach(([g,list])=>{
    const gh=document.createElement('div'); gh.className='src-group'; gh.textContent=g; sf.appendChild(gh);
    list.forEach(([k,s])=>{
      sf.appendChild(makeFilterRow({
        key:k, label:s.label, dotColor:null, count:srcCount(k), active:activeSrcs.has(k), isSrc:true,
        onToggle:()=>{
          if(activeSrcs.has(k)) activeSrcs.delete(k);
          else { activeSrcs.add(k); if(activeCats.size===0) activeCats=new Set(Object.keys(CATS)); }
          renderRail();render();
        },
        onOnly:()=>{activeSrcs=new Set([k]);activeCats=new Set(Object.keys(CATS));renderRail();render();},
      }));
    });
  });
}

/* ── Render: toolbar title ── */
function renderTitle(){
  const t=document.getElementById('periodTitle');
  if(view==='month'){t.textContent=`${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;}
  else if(view==='week'){const s=startOfWeek(cursor);const e=new Date(s);e.setDate(e.getDate()+6);
    t.textContent=`${MONTHS[s.getMonth()].slice(0,3)} ${s.getDate()} – ${MONTHS[e.getMonth()].slice(0,3)} ${e.getDate()}, ${e.getFullYear()}`;}
  else{t.textContent=`${WD[cursor.getDay()]}, ${MONTHS[cursor.getMonth()]} ${cursor.getDate()}`;}
}
function startOfWeek(dt){const s=new Date(dt);s.setDate(s.getDate()-s.getDay());s.setHours(0,0,0,0);return s;}

/* ── Render: month ──
   Each day-num and event is a <button> so keyboard users Tab through them
   and Enter/Space activates. The day cell itself is no longer focusable —
   it's a visual container only, which keeps Tab order short and predictable. */
function renderMonth(){
  const body=document.getElementById('calBody');
  const first=new Date(cursor.getFullYear(),cursor.getMonth(),1);
  const start=startOfWeek(first);
  let html=`<div class="month" role="grid" aria-label="${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()} calendar">`;
  html+='<div class="weekdays" role="row">'+WD.map(w=>`<div role="columnheader" aria-label="${WDFull[w]}">${w}</div>`).join('')+'</div>';
  html+='<div class="grid-month" role="rowgroup">';
  let inRow=false;
  for(let i=0;i<42;i++){
    if(i%7===0){if(inRow)html+='</div>';html+='<div role="row" style="display:contents">';inRow=true;}
    const dt=new Date(start);dt.setDate(start.getDate()+i);
    const dim=dt.getMonth()!==cursor.getMonth();
    const today=sameDay(dt,TODAY);
    const evs=eventsForDay(dt);
    const shown=evs.slice(0,3);
    const cellLabel=`${WDFull[WD[dt.getDay()]]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}${today?' (today)':''}`;
    html+=`<div class="day-cell${dim?' dim':''}${today?' today':''}" role="gridcell"${today?' aria-current="date"':''}>`;
    html+=`<button type="button" class="day-num-btn" data-date="${dt.toISOString()}" aria-label="View ${cellLabel}">${dt.getDate()}</button>`;
    shown.forEach(e=>{
      const c=CATS[e.cat];
      const time=e.allday?'':`<span class="etime" aria-hidden="true">${fmtTime(e.date.h,e.date.min)}</span>`;
      const aria=`${CATS[e.cat].label}: ${e.title}, ${e.allday?'all day':fmtTime(e.date.h,e.date.min)+(e.end?' to '+fmtTime(e.end.h,0):'')}`;
      html+=`<button type="button" class="evt" style="--cat:${c.color}" data-id="${e.id}" aria-label="${escAttr(aria)}">${time}<span class="etitle">${escText(e.title)}</span></button>`;
    });
    if(evs.length>3)html+=`<button type="button" class="more-link" data-date="${dt.toISOString()}" aria-label="View all ${evs.length} records on ${cellLabel}">+${evs.length-3} more</button>`;
    html+='</div>';
    if(i>=34&&dt.getMonth()!==cursor.getMonth()&&dt.getDay()===6)break;
  }
  if(inRow)html+='</div>';
  html+='</div></div>';
  body.innerHTML=html;
  bindEvents();
}

/* ── Render: week / day time grid ── */
function renderTimeGrid(days){
  const body=document.getElementById('calBody');
  const H0=7,H1=20; // 7am–8pm
  let cols=`grid-template-columns:repeat(${days.length},1fr)`;
  let html=`<div class="timegrid"><div class="time-col" aria-hidden="true">`;
  html+=`<div class="ts" style="height:30px"></div>`; // allday spacer
  for(let h=H0;h<H1;h++)html+=`<div class="ts">${fmtHour(h)}</div>`;
  html+=`</div><div class="tg-right">`;
  // head
  html+=`<div class="week-head" style="${cols}">`;
  days.forEach(dt=>{const today=sameDay(dt,TODAY);
    const fullLabel=`${WDFull[WD[dt.getDay()]]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}${today?' (today)':''}`;
    html+=`<button type="button" class="wh-cell${today?' today':''}" data-date="${dt.toISOString()}" aria-label="Switch to day view for ${escAttr(fullLabel)}"${today?' aria-current="date"':''}><span class="wd">${WD[dt.getDay()]}</span><span class="wn">${dt.getDate()}</span></button>`;});
  html+=`</div>`;
  // all-day row
  html+=`<div class="allday-row" style="${cols}" aria-label="All-day events">`;
  days.forEach(dt=>{
    html+=`<div class="ad-cell">`;
    eventsForDay(dt).filter(e=>e.allday).forEach(e=>{const c=CATS[e.cat];
      const aria=`${CATS[e.cat].label}: ${e.title}, all day on ${WDFull[WD[dt.getDay()]]} ${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
      html+=`<button type="button" class="ad-evt" style="--cat:${c.color}" data-id="${e.id}" aria-label="${escAttr(aria)}">${escText(e.title)}</button>`;});
    html+=`</div>`;
  });
  html+=`</div>`;
  // body
  html+=`<div class="week-body" style="${cols}">`;
  days.forEach(dt=>{
    html+=`<div class="wb-col">`;
    for(let h=H0;h<H1;h++)html+=`<div class="hour-line" aria-hidden="true"></div>`;
    eventsForDay(dt).filter(e=>!e.allday).forEach(e=>{
      const c=CATS[e.cat];
      const startH=e.date.h+(e.date.min||0)/60;
      const endH=e.end?e.end.h:(startH+1);
      const top=(startH-H0)*56;
      const height=Math.max(26,(endH-startH)*56-3);
      const tlabel=e.end?`${fmtTime(e.date.h,e.date.min)}–${fmtTime(e.end.h,0)}`:fmtTime(e.date.h,e.date.min);
      const aria=`${CATS[e.cat].label}: ${e.title}, ${tlabel} on ${WDFull[WD[dt.getDay()]]} ${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
      html+=`<button type="button" class="tevt" style="--cat:${c.color};top:${top}px;height:${height}px" data-id="${e.id}" aria-label="${escAttr(aria)}"><span class="tt">${escText(e.title)}</span><span class="tm" aria-hidden="true">${tlabel}</span></button>`;
    });
    html+=`</div>`;
  });
  html+=`</div></div></div>`;
  body.innerHTML=html;
  bindEvents();
}

function render(){
  renderTitle();
  const total=EVENTS.filter(passFilter).length;
  if(total===0){
    let why='No records match the current filters.';
    if(activeCats.size===0) why='Every <strong>content type</strong> is switched off — turn at least one back on in the left rail.';
    else if(activeSrcs.size===0) why='Every <strong>source</strong> is switched off — turn at least one back on in the left rail.';
    else if(query) why=`Nothing matches &ldquo;${escText(query)}&rdquo; with the current filters.`;
    else why='No records match this combination of content types and sources.';
    document.getElementById('calBody').innerHTML=
      `<div class="empty" role="status"><div class="big">Nothing to show</div><p>${why}</p><div style="margin-top:20px"><button type="button" id="resetF" class="today-btn" style="border:1px solid var(--ink-border);border-radius:var(--radius-sm);padding:9px 16px;color:var(--paper-mid)">Reset all filters</button></div></div>`;
    const r=document.getElementById('resetF');
    if(r)r.onclick=()=>{activeCats=new Set(Object.keys(CATS));activeSrcs=new Set(Object.keys(SOURCES));query='';document.getElementById('search').value='';renderRail();render();};
    document.getElementById('evtCount').textContent=`0 records shown · ${EVENTS.length} total`;
    return;
  }
  if(view==='month')renderMonth();
  else if(view==='week'){const s=startOfWeek(cursor);renderTimeGrid([...Array(7)].map((_,i)=>{const x=new Date(s);x.setDate(s.getDate()+i);return x;}));}
  else renderTimeGrid([new Date(cursor)]);
  document.getElementById('evtCount').textContent=`${total} record${total===1?'':'s'} shown · ${EVENTS.length} total`;
}

/* ── Bind event clicks ──
   Every interactive element rendered above is a native <button>, so click
   handlers also fire on Enter/Space without extra keyboard code. */
function bindEvents(){
  document.querySelectorAll('#calBody [data-id]').forEach(el=>el.onclick=(ev)=>{ev.stopPropagation();openDrawer(el.dataset.id);});
  document.querySelectorAll('#calBody .more-link[data-date]').forEach(el=>el.onclick=(ev)=>{ev.stopPropagation();cursor=new Date(el.dataset.date);setView('day');});
  document.querySelectorAll('#calBody .wh-cell[data-date]').forEach(el=>el.onclick=()=>{cursor=new Date(el.dataset.date);setView('day');});
  document.querySelectorAll('#calBody .day-num-btn[data-date]').forEach(el=>el.onclick=()=>{cursor=new Date(el.dataset.date);setView('day');});
}

/* ── Drawer ──
   Accessible dialog implementation:
   - aria-labelledby points to the dialog heading.
   - Opens with focus on the close button (after content render).
   - Closes with focus returned to whatever opened it (lastTrigger).
   - Keyboard Tab is trapped inside the open dialog. */
let lastTrigger=null;
function openDrawer(id){
  const e=byId[id];if(!e)return;
  lastTrigger=document.activeElement;
  const c=CATS[e.cat];const s=SOURCES[e.src];
  const dt=evtDate(e);
  const when=e.allday
    ? (e.span?`${MONTHS[dt.getMonth()].slice(0,3)} ${dt.getDate()}–${dt.getDate()+e.span-1}, ${dt.getFullYear()} · all day`:`${WD[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()} · all day`)
    : `${WD[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()} · ${fmtTime(e.date.h,e.date.min)}${e.end?'–'+fmtTime(e.end.h,0):''}`;
  let meta='';
  meta+=`<div class="meta-row"><div class="mk">When</div><div class="mv">${escText(when)}</div></div>`;
  if(e.loc)meta+=`<div class="meta-row"><div class="mk">Where</div><div class="mv">${escText(e.loc)}</div></div>`;
  meta+=`<div class="meta-row"><div class="mk">Owner</div><div class="mv">${escText(e.dept)}</div></div>`;
  if(e.file)meta+=`<div class="meta-row"><div class="mk">File #</div><div class="mv"><button type="button" class="parcel-chip" data-search="${escAttr(e.file)}" aria-label="Search for file ${escAttr(e.file)}">${escText(e.file)}</button></div></div>`;
  if(e.applicant)meta+=`<div class="meta-row"><div class="mk">Applicant</div><div class="mv">${escText(e.applicant)}</div></div>`;
  if(e.parcel)meta+=`<div class="meta-row"><div class="mk">Parcel</div><div class="mv"><button type="button" class="parcel-chip" data-search="${escAttr(e.parcel)}" aria-label="Search for parcel ${escAttr(e.parcel)}">${escText(e.parcel)}</button></div></div>`;
  meta+=`<div class="meta-row"><div class="mk">Source</div><div class="mv">${escText(s.label)}</div></div>`;
  let conn='';
  if(e.connected&&e.connected.length){
    conn='<div class="connected"><h3 class="conn-h">Connected records</h3><div role="list">';
    e.connected.forEach(cid=>{const ce=byId[cid];if(!ce)return;const cc=CATS[ce.cat];
      conn+=`<button type="button" class="conn-item" data-id="${escAttr(ce.id)}" role="listitem" aria-label="Open connected record: ${escAttr(ce.title)}"><span class="dot" style="background:${cc.color}" aria-hidden="true"></span><span>${escText(ce.title)}</span></button>`;});
    conn+='</div></div>';
  }
  let actions=`<a class="btn primary" href="${escAttr(e.link)}" target="_blank" rel="noopener noreferrer">${escText(e.linkLabel||'Open source')} <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in new tab)</span></a>`;
  if(e.ical)actions+=`<a class="btn ghost" href="${escAttr(e.ical)}" target="_blank" rel="noopener noreferrer">Add to calendar (.ics) <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in new tab)</span></a>`;
  const dw=document.getElementById('drawer');
  dw.style.setProperty('--cat',c.color); dw.style.setProperty('--cat-text',c.text);
  dw.innerHTML=`<div class="drawer-head"><span class="cat-tag" style="--cat:${c.color};--cat-text:${c.text}"><span class="dot" style="width:8px;height:8px;border-radius:2px;background:${c.color}" aria-hidden="true"></span>${escText(c.label)}</span>
      <button type="button" class="drawer-close" id="dwClose" aria-label="Close record details"><span aria-hidden="true">×</span></button><h2 id="drawer-title">${escText(e.title)}</h2></div>
    <div class="drawer-body">${meta}
      <div class="plain"><span class="pl-label">Plain language</span>${escText(e.summary)}</div>
      <div class="drawer-actions">${actions}</div>${conn}</div>`;
  document.getElementById('dwClose').onclick=closeDrawer;
  dw.querySelectorAll('.conn-item').forEach(el=>el.onclick=()=>openDrawer(el.dataset.id));
  dw.querySelectorAll('.parcel-chip[data-search]').forEach(el=>el.onclick=()=>{
    document.getElementById('search').value=el.dataset.search;query=el.dataset.search;closeDrawer();render();});
  document.getElementById('scrim').classList.add('open');
  dw.classList.add('open');
  dw.hidden=false;
  // Move focus into the dialog so screen reader / keyboard users land inside it.
  setTimeout(()=>document.getElementById('dwClose').focus(),20);
  trapFocus(dw);
}
function closeDrawer(){
  const dw=document.getElementById('drawer');
  dw.classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
  releaseFocusTrap();
  // After transition, mark hidden so AT skips it entirely.
  setTimeout(()=>{if(!dw.classList.contains('open'))dw.hidden=true;},320);
  if(lastTrigger&&typeof lastTrigger.focus==='function'){lastTrigger.focus();lastTrigger=null;}
}

/* ── Focus trap shared by drawer + modal ──
   Captures Tab/Shift+Tab inside the active dialog. Released on close. */
let activeTrap=null;
function trapFocus(container){
  releaseFocusTrap();
  const sel='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const handler=(ev)=>{
    if(ev.key!=='Tab')return;
    const focusable=[...container.querySelectorAll(sel)].filter(el=>!el.hidden&&el.offsetParent!==null);
    if(focusable.length===0)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
    else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
  };
  container.addEventListener('keydown',handler);
  activeTrap={container,handler};
}
function releaseFocusTrap(){
  if(!activeTrap)return;
  activeTrap.container.removeEventListener('keydown',activeTrap.handler);
  activeTrap=null;
}

/* ── View switching & nav ── */
function setView(v){
  view=v;
  document.querySelectorAll('.view-switch button').forEach(b=>{
    const on=b.dataset.view===v;
    b.classList.toggle('active',on);
    b.setAttribute('aria-pressed',String(on));
  });
  render();
  announce(`Switched to ${v} view`);
}
/* Polite announcer for screen readers — used after view switches and filter
   changes so the change is perceptible without visual focus. */
function announce(msg){
  const el=document.getElementById('cal-announce');
  if(!el)return;
  el.textContent='';                 // re-trigger AT
  setTimeout(()=>{el.textContent=msg;},30);
}
function step(dir){
  if(view==='month')cursor.setMonth(cursor.getMonth()+dir);
  else if(view==='week')cursor.setDate(cursor.getDate()+7*dir);
  else cursor.setDate(cursor.getDate()+dir);
  cursor=new Date(cursor);render();
}

/* ── Wire up ── */
document.querySelectorAll('.view-switch button').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.getElementById('prev').onclick=()=>step(-1);
document.getElementById('next').onclick=()=>step(1);
document.getElementById('todayBtn').onclick=()=>{cursor=new Date(TODAY);render();};
document.getElementById('selAll').onclick=()=>{activeCats=new Set(Object.keys(CATS));activeSrcs=new Set(Object.keys(SOURCES));renderRail();render();};
document.getElementById('selNone').onclick=()=>{activeCats=new Set();activeSrcs=new Set();renderRail();render();};
document.getElementById('search').oninput=(e)=>{query=e.target.value;render();};
document.getElementById('scrim').onclick=closeDrawer;
document.getElementById('menuBtn').onclick=(ev)=>{
  const rail=document.getElementById('rail');
  const open=!rail.classList.contains('open');
  rail.classList.toggle('open',open);
  ev.currentTarget.setAttribute('aria-expanded',String(open));
};
/* Escape closes whichever dialog is open. Targeted so it doesn't fire when no dialog is up. */
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(document.getElementById('drawer').classList.contains('open')){closeDrawer();}
  else if(document.getElementById('subModal').classList.contains('open')){closeSub();}
});

/* ============================================================
   Topics module — inlined plain-JS port of shared/topics.ts
   (single source of truth in the repo; embedded here so this
   microsite stays self-contained). Kept byte-for-byte in sync
   with topics.ts: same TOPICS, same mapping + digest + related.
   ============================================================ */
const Topics=(function(){
  const TOPICS=[
    {id:'public-meetings',label:'Public meetings & hearings',blurb:'When elected and appointed bodies meet, and when you can speak.',types:['recurring'],sources:['legistar','bocc','ppld','cosgov'],geoAware:false},
    {id:'development-near-me',label:'Development & permits near me',blurb:'Projects, rezonings and building permits on parcels in your area.',types:['project'],sources:['epc','pprbd','accela','cosgov','bocc','opendata'],geoAware:true},
    {id:'bids-contracts',label:'Bids & contracts',blurb:'Open solicitations and procurement deadlines.',types:['notice'],sources:['procurement'],geoAware:false},
    {id:'public-comment',label:'Public comment & legal notices',blurb:'Comment windows and legal notices — your chance to weigh in.',types:['notice'],sources:['cosgov','ldc'],geoAware:false},
    {id:'licenses-inspections',label:'Licenses & inspections',blurb:'Liquor/business license filings and health inspection results.',types:['notice'],sources:['accela','health'],geoAware:false},
    {id:'emergency-closures',label:'Emergency alerts & closures',blurb:'Evacuations, fire weather, water advisories and road closures.',types:['alert'],sources:['pproem','csu','codot','cosgov'],geoAware:true},
    {id:'city-news',label:'News & announcements',blurb:'Releases, data updates and regional planning news.',types:['news'],sources:['cosgov','parks','policedata','ppacg','opendata'],geoAware:false},
    {id:'guides',label:'How-to guides & reference',blurb:'Reference pages: filing CORA, permits, assessments, the LDC.',types:['book'],sources:['cosgov','assessor','ldc'],geoAware:false},
  ];
  const BY_ID=Object.fromEntries(TOPICS.map(t=>[t.id,t]));
  const topicsForEvent=e=>TOPICS.filter(t=>t.types.includes(e.cat)&&t.sources.includes(e.src)).map(t=>t.id);
  function eventInSubscription(e,sub){
    if(sub.pinned&&sub.pinned.includes(e.id))return true; // followed individually
    const ets=topicsForEvent(e);
    const hit=sub.topics.find(id=>ets.includes(id));
    if(!hit)return false;
    if(sub.zip&&BY_ID[hit].geoAware&&!e.parcel)return false;
    return true;
  }
  function calendarFiltersToTopics(types,sources){
    const T=new Set(types),S=new Set(sources);
    return TOPICS.filter(t=>t.types.some(x=>T.has(x))&&t.sources.some(x=>S.has(x))).map(t=>t.id);
  }
  function makeCalendarSubscription(o){
    return {id:'sub-'+Math.random().toString(36).slice(2,9),channels:o.channels||['email'],
      cadence:o.cadence||'monthly',topics:calendarFiltersToTopics(o.activeTypes,o.activeSources),
      pinned:o.pinned?[...o.pinned]:[],zip:o.zip,includeRelated:o.includeRelated!==false,createdFrom:'calendar'};
  }
  function findRelated(candidates,matched,limit){
    limit=limit||6;const mids=new Set(matched.map(m=>m.id));const out=[];
    for(const x of candidates){
      if(mids.has(x.id))continue;const reasons=[];let score=0;
      for(const m of matched){
        if((x.connected&&x.connected.includes(m.id))||(m.connected&&m.connected.includes(x.id))){reasons.push(`Connected to “${m.title}”, which you follow`);score+=3;}
        if(x.parcel&&m.parcel&&x.parcel===m.parcel){reasons.push(`Same parcel (${x.parcel}) as “${m.title}”`);score+=3;}
        if(x.dept&&m.dept&&x.dept===m.dept){reasons.push(`Same office (${x.dept}) as “${m.title}”`);score+=1;}
      }
      if(score>0){const seen=new Set();const top=reasons.filter(r=>seen.has(r)?false:(seen.add(r),true)).slice(0,2);out.push({event:x,reasons:top,score});}
    }
    return out.sort((a,b)=>b.score-a.score).slice(0,limit);
  }
  function buildMonthlyDigest(events,sub,inMonth){
    const me=events.filter(inMonth);
    const matched=me.filter(e=>eventInSubscription(e,sub));
    const sections=sub.topics.map(id=>({topic:BY_ID[id],events:matched.filter(e=>topicsForEvent(e).includes(id))})).filter(s=>s.events.length>0);
    const covered=new Set(sections.flatMap(s=>s.events.map(e=>e.id)));
    const pinnedSet=new Set(sub.pinned||[]);
    const extraPinned=matched.filter(e=>pinnedSet.has(e.id)&&!covered.has(e.id));
    const related=sub.includeRelated?findRelated(me,matched,6):[];
    return {cadence:sub.cadence,matched:matched.length,sections,extraPinned,related};
  }
  return {TOPICS,topicsForEvent,calendarFiltersToTopics,makeCalendarSubscription,buildMonthlyDigest,findRelated,getTopic:id=>BY_ID[id]};
})();

/* ── Subscribe modal: calendar filters → shared subscription object → live digest ── */
let subState={cadence:'monthly',includeRelated:true,topics:null,email:'',pinned:[]};
/* One record per resident, keyed by email — the upsert that prevents
   "a Subscribe button on every page = three mailing lists." Saving the same
   email again MERGES topics into the existing record (this is what the
   Notification Center does server-side; here it's in-session to demonstrate). */
const sessionSubs={};
function saveSubscription(){
  const email=subState.email.trim();
  const note=document.querySelector('#subModal .modal-note');
  if(!email){ note.innerHTML=`<strong>Add an email above</strong> to save — that address is what ties everything to one record.`; return; }
  const sub=currentSubscription();
  if(sessionSubs[email]){
    const ex=sessionSubs[email];
    const before=ex.topics.length;
    ex.topics=[...new Set([...ex.topics,...sub.topics])];
    ex.cadence=sub.cadence;
    ex.includeRelated=ex.includeRelated||sub.includeRelated;
    ex.channels=[...new Set([...ex.channels,...sub.channels])];
    ex._lastAdded=ex.topics.length-before;
    ex._merged=true;
  }else{
    sessionSubs[email]={email,id:sub.id,channels:[...sub.channels],cadence:sub.cadence,includeRelated:sub.includeRelated,topics:[...sub.topics],_lastAdded:sub.topics.length,_merged:false};
  }
  renderSub();
}
function currentSubscription(){
  const sub=Topics.makeCalendarSubscription({
    activeTypes:[...activeCats], activeSources:[...activeSrcs],
    cadence:subState.cadence, includeRelated:subState.includeRelated,
  });
  if(subState.topics) sub.topics=[...subState.topics]; // user's in-modal edits win
  sub.pinned=[...(subState.pinned||[])];
  return sub;
}
function openSub(){
  lastTrigger=document.activeElement;
  subState.topics=Topics.calendarFiltersToTopics([...activeCats],[...activeSrcs]); // seed from calendar
  renderSub();
  document.getElementById('subScrim').classList.add('open');
  const modal=document.getElementById('subModal');
  modal.classList.add('open');
  modal.hidden=false;
  setTimeout(()=>document.getElementById('subClose').focus(),20);
  trapFocus(modal);
}
function closeSub(){
  const modal=document.getElementById('subModal');
  document.getElementById('subScrim').classList.remove('open');
  modal.classList.remove('open');
  releaseFocusTrap();
  setTimeout(()=>{if(!modal.classList.contains('open'))modal.hidden=true;},320);
  if(lastTrigger&&typeof lastTrigger.focus==='function'){lastTrigger.focus();lastTrigger=null;}
}
function renderSub(){
  const sub=currentSubscription();
  const monthName=`${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const inMonth=e=>e.date.m===cursor.getMonth()+1 && e.date.y===cursor.getFullYear();
  const digest=Topics.buildMonthlyDigest(EVENTS,sub,inMonth);

  // topic chips: toggleable here — seeded from calendar filters, but editable
  const allTopics=Topics.TOPICS;
  const subSet=new Set(sub.topics);
  const chips=allTopics.map(t=>`<button class="topic-chip${subSet.has(t.id)?'':' muted'}" data-topic="${t.id}" title="${t.blurb}">${subSet.has(t.id)?'✓ ':''}${t.label}</button>`).join('');

  // digest preview
  let digestHtml='';
  if(sub.topics.length===0){
    digestHtml=`<div class="digest"><div class="dsub">No topics selected — turn on some content types and sources in the calendar to build a digest.</div></div>`;
  }else{
    let sec=digest.sections.map(s=>
      `<div class="dtopic"><div class="tname">${s.topic.label}</div>`+
      s.events.map(e=>`<div class="ditem">${e.title}</div>`).join('')+`</div>`).join('');
    if(!sec)sec=`<div class="dsub">Nothing in ${monthName} for these topics — try another month with the ‹ › arrows behind this dialog.</div>`;
    let pinnedHtml='';
    if(digest.extraPinned&&digest.extraPinned.length){
      pinnedHtml=`<div class="dtopic added"><div class="tname">★ Following — added from suggestions</div>`+
        digest.extraPinned.map(e=>`<div class="ditem ditem-row"><span>${e.title}</span><button class="follow-btn on" data-unpin="${e.id}">✓ Following</button></div>`).join('')+`</div>`;
    }
    let rel='';
    if(subState.includeRelated){
      if(digest.related.length){
        rel=`<div class="related"><div class="rhead">↳ Things you're not following, but might want to</div>`+
          digest.related.map(r=>`<div class="ritem"><div class="ritem-top"><div class="rt">${r.event.title}</div><button class="follow-btn" data-pin="${r.event.id}">+ Follow</button></div>`+
            r.reasons.map(x=>`<div class="rr">${x}</div>`).join('')+`</div>`).join('')+`</div>`;
      }else{
        rel=`<div class="related"><div class="rhead">↳ Things you're not following</div><div class="dsub">No connected items this month.</div></div>`;
      }
    }
    digestHtml=`<div class="digest"><div class="dhead">Your ${sub.cadence} digest — ${monthName}</div>`+
      `<div class="dsub">${digest.matched} item${digest.matched===1?'':'s'} you follow${subState.includeRelated?` · ${digest.related.length} related`:''}</div>`+
      sec+pinnedHtml+rel+`</div>`;
  }

  // Active subscriptions for this session — proves the upsert (one record per email)
  const subEmails=Object.keys(sessionSubs);
  let activeHtml='';
  if(subEmails.length){
    activeHtml=`<div class="modal-section active-subs"><span class="lab">Your subscription${subEmails.length>1?'s':''} (this session)</span>`+
      subEmails.map(em=>{const r=sessionSubs[em];
        return `<div class="active-sub"><div class="as-main"><div class="as-email">${em}</div>`+
          `<div class="as-meta">one ${r.cadence} email · ${r.topics.length} topic${r.topics.length===1?'':'s'} · ${r.channels.join(', ')}${r.includeRelated?' · related on':''}</div></div>`+
          `<button class="as-remove" data-email="${em}" title="Remove">×</button></div>`+
          (r._merged?`<div class="as-flag">↳ Last save merged in — added ${r._lastAdded} new topic${r._lastAdded===1?'':'s'}, still one email.</div>`:'')+
          (!r._merged&&r._lastAdded?`<div class="as-flag ok">↳ Created. Subscribe again from any page with this email and it merges here — no second email.</div>`:'');
      }).join('')+`</div>`;
  }

  const subJson=JSON.stringify(sub,null,2);
  document.getElementById('subModal').innerHTML=`
    <div class="modal-head">
      <button type="button" class="drawer-close" id="subClose" aria-label="Close subscribe dialog"><span aria-hidden="true">×</span></button>
      <h2 id="sub-title">Subscribe to a digest</h2>
      <p>Built from your current calendar filters. This is the same subscription object the Notification Center stores.</p>
    </div>
    <div class="modal-body">
      ${activeHtml}
      <div class="modal-section">
        <span class="lab">Topics — tap to add or remove <a href="#" id="topicReset" class="reset-link">reset to my calendar filters</a></span>
        <div class="topic-chips">${chips}</div>
      </div>
      <div class="modal-section">
        <span class="lab">Cadence & options</span>
        <div class="ctl-row">
          <div class="seg" id="cadenceSeg">
            <button data-c="weekly" class="${subState.cadence==='weekly'?'on':''}">Weekly</button>
            <button data-c="monthly" class="${subState.cadence==='monthly'?'on':''}">Monthly</button>
          </div>
          <label class="check"><input type="checkbox" id="relChk" ${subState.includeRelated?'checked':''}> Include related items I'm not following</label>
        </div>
      </div>
      <div class="modal-section">
        <span class="lab">Deliver to</span>
        <input type="email" id="subEmail" placeholder="you@example.com" value="${subState.email}">
        <div class="email-hint">Saving with the same address always updates one record — it never creates a second subscription.</div>
      </div>
      <div class="modal-section">
        <span class="lab">Preview</span>
        ${digestHtml}
      </div>
      <div class="modal-actions">
        <button class="btn primary" id="subSave">Save subscription</button>
        <button class="btn ghost" id="subCancel">Cancel</button>
      </div>
      <div class="modal-note"><strong>Preview only.</strong> Actually sending the digest needs a backend mail service. This panel shows exactly what the email would contain and produces the subscription record below — which the goGov Notification Center would persist and let you manage.</div>
      <details class="json-peek"><summary>View the subscription object this emits</summary><pre>${subJson}</pre></details>
    </div>`;

  document.getElementById('subClose').onclick=closeSub;
  document.getElementById('subCancel').onclick=closeSub;
  document.querySelectorAll('.topic-chip[data-topic]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.topic; const set=new Set(subState.topics);
    set.has(id)?set.delete(id):set.add(id); subState.topics=[...set]; renderSub();
  });
  document.getElementById('topicReset').onclick=(e)=>{e.preventDefault();subState.topics=Topics.calendarFiltersToTopics([...activeCats],[...activeSrcs]);renderSub();};
  document.querySelectorAll('#cadenceSeg button').forEach(b=>b.onclick=()=>{subState.cadence=b.dataset.c;renderSub();});
  document.getElementById('relChk').onchange=(e)=>{subState.includeRelated=e.target.checked;renderSub();};
  const emailEl=document.getElementById('subEmail');
  emailEl.oninput=(e)=>{subState.email=e.target.value;};
  document.getElementById('subSave').onclick=saveSubscription;
  document.querySelectorAll('.as-remove').forEach(b=>b.onclick=()=>{delete sessionSubs[b.dataset.email];renderSub();});
  document.querySelectorAll('.follow-btn[data-pin]').forEach(b=>b.onclick=()=>{const s=new Set(subState.pinned||[]);s.add(b.dataset.pin);subState.pinned=[...s];renderSub();});
  document.querySelectorAll('.follow-btn[data-unpin]').forEach(b=>b.onclick=()=>{const s=new Set(subState.pinned||[]);s.delete(b.dataset.unpin);subState.pinned=[...s];renderSub();});
}
document.getElementById('subBtn').onclick=openSub;
document.getElementById('subScrim').onclick=closeSub;

renderRail();render();

  }
})(Drupal, once);

