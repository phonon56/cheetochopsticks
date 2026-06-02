import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  AreaChart, Area, ReferenceDot, ReferenceLine, Legend, BarChart, Bar
} from "recharts";

// ============================================================================
// DATA — all primary-source verified across 23 CAFRs/ACFRs 2002–2024
// ============================================================================

const netPositionSeries = [
  { year: 2002, np: 1838611926, yoy: null, event: "GASB 34 adopted — first year of modern reporting", eventType: "foundation" },
  { year: 2003, np: 1893212952, yoy: 3.0 },
  { year: 2004, np: 2265969175, yoy: 19.7, event: "GASB 34 infrastructure phase-in (retroactive capitalization)", eventType: "accounting" },
  { year: 2005, np: 2653006755, yoy: 17.1, event: "PPRTA 1% regional sales tax begins (approved Nov 2004)", eventType: "tax" },
  { year: 2006, np: 2685762919, yoy: 1.2 },
  { year: 2007, np: 2922032358, yoy: 8.8 },
  { year: 2008, np: 2710068824, yoy: -7.3, event: "Great Recession — Utilities investment losses, MHS pressure", eventType: "recession" },
  { year: 2009, np: 3005207427, yoy: 10.9 },
  { year: 2010, np: 3137967812, yoy: 4.4 },
  { year: 2011, np: 3316153292, yoy: 5.7 },
  { year: 2012, np: 3055916872, yoy: -7.9, event: "Memorial Hospital transferred to UCHealth (Oct 1, 2012)", eventType: "structural" },
  { year: 2013, np: 3008151577, yoy: -1.6, event: "GASB 65 adopted — ~$80M prior-period adjustment", eventType: "accounting" },
  { year: 2014, np: 3127706505, yoy: 4.0 },
  { year: 2015, np: 2933293322, yoy: -6.2, event: "GASB 68 — pension liability first booked ($194M hit)", eventType: "accounting" },
  { year: 2016, np: 3076735219, yoy: 4.9, event: "2C Road Tax begins (0.62% city sales tax)", eventType: "tax" },
  { year: 2017, np: 3197299541, yoy: 3.9, event: "Stormwater fee approved by voters (Nov 2017)", eventType: "tax" },
  { year: 2018, np: 3310348409, yoy: 3.5, event: "GASB 75 — OPEB liability booked ($113M adj). Stormwater fee active.", eventType: "accounting" },
  { year: 2019, np: 3595877166, yoy: 8.6, event: "Stormwater enterprise full first year" },
  { year: 2020, np: 3601165495, yoy: 0.1, event: "COVID + $67M coal plant impairment (offsetting)", eventType: "recession" },
  { year: 2021, np: 3872855969, yoy: 7.5 },
  { year: 2022, np: 4511757940, yoy: 16.5, event: "Post-pandemic rebound + natural gas price surge", eventType: "rebound" },
  { year: 2023, np: 4773893939, yoy: 5.8 },
  { year: 2024, np: 5083202074, yoy: 6.5, event: "GASB 100/101 compensated-absences restatement" },
];

// Sales tax rate stack — 1996 to 2024. Each layer is a separate tax.
const taxStackSeries = [
  // Before voter-stacked era
  { year: 1996, cityBase: 2.10, tops: 0, psst: 0, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 1997, cityBase: 2.00, tops: 0.05, psst: 0, roadTax2C: 0, county: 1.00, pprta: 0 }, // TOPS half-year July 1
  { year: 1998, cityBase: 2.00, tops: 0.10, psst: 0, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 1999, cityBase: 2.00, tops: 0.10, psst: 0, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 2000, cityBase: 2.00, tops: 0.10, psst: 0, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 2001, cityBase: 2.00, tops: 0.10, psst: 0, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 2002, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 2003, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 2004, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 0 },
  { year: 2005, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2006, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2007, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2008, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2009, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2010, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2011, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2012, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2013, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2014, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2015, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0, county: 1.00, pprta: 1.00 },
  { year: 2016, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2017, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2018, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2019, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2020, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2021, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2022, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2023, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
  { year: 2024, cityBase: 2.00, tops: 0.10, psst: 0.40, roadTax2C: 0.62, county: 1.23, pprta: 1.00 },
];
taxStackSeries.forEach(r => { r.total = +(r.cityBase + r.tops + r.psst + r.roadTax2C + r.county + r.pprta).toFixed(2); });

const salesTaxDollars = [
  { year: 2004, amount: 116.5 }, { year: 2005, amount: 118.6 }, { year: 2006, amount: 122.6 },
  { year: 2007, amount: 125.7 }, { year: 2008, amount: 116.0 }, { year: 2009, amount: 111.0 },
  { year: 2010, amount: 117.4 }, { year: 2011, amount: 118.6 }, { year: 2012, amount: 126.9 },
  { year: 2013, amount: 134.1 }, { year: 2014, amount: 142.1 }, { year: 2015, amount: 148.7 },
  { year: 2016, amount: 162.1 }, { year: 2017, amount: 170.2 }, { year: 2018, amount: 181.2 },
  { year: 2019, amount: 185.5 }, { year: 2020, amount: 186.3 }, { year: 2021, amount: 231.2 },
  { year: 2022, amount: 247.8 }, { year: 2023, amount: 247.7 }, { year: 2024, amount: 250.4 },
];

// ============================================================================
// GLOSSARY — plain-language definitions of everything that's been flying by
// ============================================================================
const glossary = [
  {
    term: "CAFR / ACFR",
    full: "Comprehensive Annual Financial Report / Annual Comprehensive Financial Report",
    plain:
      "The big audited financial book every city must publish every year. Renamed from CAFR to ACFR around 2021 — same document. Runs 200–350 pages of tables. Everything in this dashboard was extracted from the 23 consecutive CAFRs/ACFRs that Colorado Springs has published since 2002.",
    category: "reports",
  },
  {
    term: "MD&A",
    full: "Management's Discussion and Analysis",
    plain:
      "The narrative section at the front of every CAFR where city staff explain in semi-plain language what happened that year. Required by GASB 34. Usually the only readable part of the report.",
    category: "reports",
  },
  {
    term: "GASB",
    full: "Governmental Accounting Standards Board",
    plain:
      "The national body that sets accounting rules for state and local governments — the public-sector cousin of FASB. GASB standards are numbered (GASB 34, 68, 75, etc.) and each one can force governments to add or remove entire categories of liabilities from their balance sheet, which is why you'll see step-changes in the dataset in adoption years.",
    category: "accounting",
  },
  {
    term: "GASB 34",
    full: "Statement No. 34 — Basic Financial Statements for State and Local Governments",
    plain:
      "The 1999 rule that reshaped how cities report finances. It created the consolidated balance sheet we now take for granted. Colorado Springs adopted it in fiscal year 2002 — which is why this dataset starts there. Pre-2002 data exists only in fund-level format and isn't comparable.",
    category: "accounting",
  },
  {
    term: "GASB 68 / 75",
    full: "Pension & OPEB liability recognition",
    plain:
      "Two rules that forced cities to put their pension obligations (GASB 68, effective 2015) and retiree healthcare obligations (GASB 75, effective 2018) directly on the balance sheet. Before these rules, those obligations were disclosed in footnotes but didn't count against 'net position.' Adoption causes a one-time restatement — that's why the net position line dips in 2015 and 2018 even though operations were fine.",
    category: "accounting",
  },
  {
    term: "MHS / Memorial Health System",
    full: "Memorial Hospital (city-owned, 1943–2012)",
    plain:
      "Colorado Springs used to own its own hospital. On October 1, 2012, the city leased the hospital and transferred operations to Poudre Valley Health Care (a UCHealth affiliate) — effectively divesting. The big -$260M drop in 2012 was mostly just the hospital leaving the city's books, not an operational failure.",
    category: "structural",
  },
  {
    term: "TOPS",
    full: "Trails, Open Space and Parks",
    plain:
      "A 0.10% CITY sales tax, voter-approved in 1997 and active since July 1, 1997. Not a non-profit. The City of Colorado Springs collects it and spends it through the Parks department on trail maintenance, open space preservation, and park upkeep. Partners with land trusts like Palmer Land Conservancy on specific projects — you might be thinking of those — but TOPS itself is a line on every sales tax receipt that goes straight to City Hall.",
    category: "taxes",
  },
  {
    term: "PSST / Public Safety Sales Tax",
    full: "Colorado Springs Public Safety Sales Tax",
    plain:
      "A 0.40% CITY sales tax, voter-approved 2001 and active since January 1, 2002. Funds Colorado Springs Police Department (CSPD) and Colorado Springs Fire Department specifically. This is NOT the sheriff's office — the El Paso County Sheriff is a separate agency funded by county property taxes. When you get pulled over inside city limits it's CSPD; outside it's the Sheriff. PSST is a dedicated revenue stream for city public safety, not a general county program.",
    category: "taxes",
  },
  {
    term: "PPRTA",
    full: "Pikes Peak Rural Transportation Authority",
    plain:
      "A 1.00% REGIONAL sales tax, voter-approved November 2004 and active since January 1, 2005. Covers El Paso County + Colorado Springs + Manitou Springs + Green Mountain Falls — all four jurisdictions at once. Funds regional road and transit infrastructure. Called 'overlapping' in the CAFR because you pay it on top of the city tax on the same transactions, but the money goes to a separate regional board, not to the city.",
    category: "taxes",
  },
  {
    term: "2C Road Tax",
    full: "Road Repair, Maintenance and Improvement Sales Tax",
    plain:
      "A 0.62% CITY sales tax first approved by voters November 2015 for a five-year term (2016–2020) to fix potholes after years of deferred road maintenance. Renewed 2020 for 2021–2025. Extended again in November 2024 for 2026–2035 by 74% voter approval. Ballot measures in Colorado are numbered; '2C' was the issue number in 2015.",
    category: "taxes",
  },
  {
    term: "Net Position",
    full: "Total primary government net position",
    plain:
      "A single bottom-line number: the city's total assets minus its total liabilities. Before 2012 it was called 'net assets.' It's roughly the city's 'net worth,' but with caveats — it includes non-cash things like roads and sewers (which can't be sold to pay bills) and excludes things like future tax revenue. Think of it as a high-level health indicator, not a liquid balance.",
    category: "accounting",
  },
  {
    term: "Mill Levy",
    full: "Property tax rate",
    plain:
      "The property tax rate, expressed in 'mills' (thousandths). A mill levy of 1.0 means you pay $1 in property tax per $1,000 of assessed value. In Colorado Springs the total mill levy on a residential parcel is the sum of the city mill, county mill, school district mill, library district mill, water district mill, etc. — usually 70–100 mills total, depending on location.",
    category: "taxes",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================
export default function COSFinancialDashboard() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [tableSearch, setTableSearch] = useState("");
  const [tableSort, setTableSort] = useState({ key: "year", dir: "desc" });
  const [expandedGlossary, setExpandedGlossary] = useState(null);
  const [glossaryFilter, setGlossaryFilter] = useState("all");

  const selectedRow = netPositionSeries.find(r => r.year === selectedYear);
  const selectedTax = taxStackSeries.find(r => r.year === selectedYear);

  const sortedTable = useMemo(() => {
    let rows = [...netPositionSeries];
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter(r =>
        String(r.year).includes(q) ||
        (r.event && r.event.toLowerCase().includes(q))
      );
    }
    rows.sort((a, b) => {
      const av = a[tableSort.key] ?? -Infinity;
      const bv = b[tableSort.key] ?? -Infinity;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return tableSort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [tableSearch, tableSort]);

  const filteredGlossary = glossary.filter(g =>
    glossaryFilter === "all" || g.category === glossaryFilter
  );

  // Color palette — editorial, civic gravity
  const ink = "#1C1E21";
  const paper = "#F7F4ED";
  const forest = "#0B3D2E";
  const recession = "#8B2C2C";
  const gold = "#B4803A";
  const muted = "#7A7A73";

  const eventColors = {
    recession: recession,
    structural: "#6B4226",
    accounting: "#4A5D73",
    tax: forest,
    rebound: "#6B7B3A",
    foundation: gold,
  };

  const taxColors = {
    cityBase: "#0B3D2E",
    tops: "#6B7B3A",
    psst: "#8B2C2C",
    roadTax2C: "#B4803A",
    county: "#4A5D73",
    pprta: "#6B4226",
  };

  const fontDisplay = '"Fraunces", "Source Serif 4", Georgia, serif';
  const fontBody = '"Public Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const fontMono = '"JetBrains Mono", "SF Mono", Menlo, monospace';

  const fmtM = (n) => "$" + (n / 1e6).toFixed(0) + "M";
  const fmtB = (n) => "$" + (n / 1e9).toFixed(2) + "B";
  const fmtFull = (n) => "$" + n.toLocaleString();

  // Custom tooltip for net position chart
  const NPTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        className="px-4 py-3 rounded-sm shadow-lg"
        style={{
          background: paper,
          border: `1px solid ${ink}`,
          fontFamily: fontBody,
          minWidth: 220,
        }}
      >
        <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 500, color: ink }}>
          Fiscal Year {d.year}
        </div>
        <div style={{ fontFamily: fontMono, fontSize: 14, color: forest, marginTop: 4 }}>
          {fmtB(d.np)}
        </div>
        {d.yoy !== null && (
          <div style={{ fontSize: 12, color: d.yoy < 0 ? recession : muted, marginTop: 2 }}>
            {d.yoy >= 0 ? "+" : ""}{d.yoy}% YoY
          </div>
        )}
        {d.event && (
          <div style={{ fontSize: 11, color: muted, marginTop: 6, fontStyle: "italic", maxWidth: 260 }}>
            {d.event}
          </div>
        )}
      </div>
    );
  };

  const TaxTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        className="px-4 py-3 rounded-sm shadow-lg"
        style={{
          background: paper,
          border: `1px solid ${ink}`,
          fontFamily: fontBody,
          minWidth: 220,
        }}
      >
        <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: fontMono, fontSize: 20, color: forest, marginTop: 2 }}>
          {d.total.toFixed(2)}%
        </div>
        <div style={{ fontSize: 11, color: muted, marginTop: 8, borderTop: `1px solid ${muted}`, paddingTop: 6 }}>
          <div>City base: {d.cityBase.toFixed(2)}%</div>
          {d.tops > 0 && <div>TOPS: {d.tops.toFixed(2)}%</div>}
          {d.psst > 0 && <div>PSST: {d.psst.toFixed(2)}%</div>}
          {d.roadTax2C > 0 && <div>2C Road Tax: {d.roadTax2C.toFixed(2)}%</div>}
          <div>El Paso County: {d.county.toFixed(2)}%</div>
          {d.pprta > 0 && <div>PPRTA: {d.pprta.toFixed(2)}%</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: paper, color: ink, fontFamily: fontBody, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
        body { background: ${paper}; }
        .num { font-family: ${fontMono}; font-variant-numeric: tabular-nums; }
        .display { font-family: ${fontDisplay}; font-feature-settings: "ss01", "ss02"; letter-spacing: -0.01em; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-10 md:px-12 md:py-16">

        {/* ==================== HEADER ==================== */}
        <header className="border-b pb-10 mb-12" style={{ borderColor: ink }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div
                className="uppercase tracking-widest text-xs mb-3"
                style={{ color: muted, letterSpacing: "0.2em" }}
              >
                City of Colorado Springs · Financial Module · Draft 0.1
              </div>
              <h1 className="display text-4xl md:text-6xl leading-none mb-3" style={{ fontWeight: 500 }}>
                Twenty-Three Years
                <span style={{ color: forest, fontStyle: "italic", fontWeight: 400 }}> of a city's balance sheet</span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed mt-4" style={{ color: "#3A3A38" }}>
                Primary-source verified across every CAFR and ACFR the city has published since it adopted
                GASB&nbsp;34 in fiscal year 2002. The dataset cannot extend earlier because that's when modern
                accrual-basis reporting began — everything before is in an incompatible older format.
              </p>
            </div>
            <div className="text-right">
              <div className="num text-xs" style={{ color: muted }}>COMPILED</div>
              <div className="num text-sm" style={{ color: ink }}>Apr 20 2026</div>
              <div className="num text-xs mt-3" style={{ color: muted }}>SOURCE FILES</div>
              <div className="num text-sm" style={{ color: ink }}>23 CAFRs / ACFRs</div>
              <div className="num text-xs mt-3" style={{ color: muted }}>VERIFIED SPAN</div>
              <div className="num text-sm" style={{ color: forest }}>2002 → 2024</div>
            </div>
          </div>
        </header>

        {/* ==================== KEY NUMBERS ==================== */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Net position 2002", val: "$1.84B", sub: "GASB 34 starting line" },
            { label: "Net position 2024", val: "$5.08B", sub: "Latest audited year" },
            { label: "23-year CAGR", val: "4.52%", sub: "Compound growth rate" },
            { label: "Deepest dip", val: "−7.9%", sub: "2012, MHS transfer" },
          ].map((k) => (
            <div key={k.label} className="pt-2" style={{ borderTop: `2px solid ${ink}` }}>
              <div className="uppercase tracking-wider text-xs mb-2" style={{ color: muted, letterSpacing: "0.15em" }}>
                {k.label}
              </div>
              <div className="display text-3xl md:text-4xl" style={{ color: forest, fontWeight: 500 }}>
                {k.val}
              </div>
              <div className="text-xs mt-1" style={{ color: muted }}>{k.sub}</div>
            </div>
          ))}
        </section>

        {/* ==================== GLOSSARY ==================== */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
            <h2 className="display text-3xl md:text-4xl" style={{ fontWeight: 500 }}>
              Plain language
              <span style={{ fontStyle: "italic", color: forest }}> first</span>
            </h2>
            <div className="flex gap-1 text-xs">
              {["all", "taxes", "accounting", "reports", "structural"].map(c => (
                <button
                  key={c}
                  onClick={() => setGlossaryFilter(c)}
                  className="px-3 py-1.5 uppercase tracking-wider transition"
                  style={{
                    background: glossaryFilter === c ? ink : "transparent",
                    color: glossaryFilter === c ? paper : ink,
                    border: `1px solid ${ink}`,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: ink }}>
            {filteredGlossary.map((g, i) => {
              const isOpen = expandedGlossary === g.term;
              return (
                <div key={g.term} style={{ background: paper }} className="p-6 cursor-pointer hover:bg-opacity-50 transition"
                  onClick={() => setExpandedGlossary(isOpen ? null : g.term)}>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h3 className="display text-2xl" style={{ fontWeight: 600, color: ink }}>{g.term}</h3>
                    <span className="uppercase tracking-widest text-xs" style={{ color: muted, letterSpacing: "0.15em" }}>
                      {g.category}
                    </span>
                  </div>
                  <div className="text-sm italic mb-3" style={{ color: forest }}>{g.full}</div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: "#3A3A38",
                      maxHeight: isOpen ? 500 : 68,
                      overflow: "hidden",
                      transition: "max-height 0.3s ease",
                    }}
                  >
                    {g.plain}
                  </p>
                  {!isOpen && g.plain.length > 150 && (
                    <div className="text-xs mt-2" style={{ color: gold, fontWeight: 500 }}>
                      Click to read more →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================== TAX STACK — THE BIG ONE ==================== */}
        <section className="mb-16">
          <div className="mb-4">
            <div className="uppercase tracking-widest text-xs mb-3" style={{ color: gold, letterSpacing: "0.2em", fontWeight: 600 }}>
              The part that was confusing you
            </div>
            <h2 className="display text-3xl md:text-4xl mb-3" style={{ fontWeight: 500 }}>
              How the sales tax stack <span style={{ fontStyle: "italic", color: forest }}>actually</span> grew
            </h2>
            <p className="max-w-3xl leading-relaxed" style={{ color: "#3A3A38" }}>
              Total sales tax in Colorado Springs went from <span className="num" style={{ color: forest, fontWeight: 600 }}>3.10%</span> in 1996 to{" "}
              <span className="num" style={{ color: forest, fontWeight: 600 }}>5.35%</span> today. The city's{" "}
              <em>base</em> rate actually <em>fell</em> (2.10%→2.00% in 1997). Every layer above the base is a separate,
              voter-approved, dedicated-purpose tax with a specific name. Hover to see the stack composition for any year.
            </p>
          </div>

          <div
            className="bg-white p-6"
            style={{ border: `1px solid ${ink}`, background: "#FBFAF5" }}
          >
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={taxStackSeries} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#D8D4C8" />
                <XAxis dataKey="year" stroke={ink} tick={{ fontFamily: fontMono, fontSize: 11 }}
                  ticks={[1996, 1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024]} />
                <YAxis stroke={ink} tick={{ fontFamily: fontMono, fontSize: 11 }}
                  label={{ value: "Total rate (%)", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fontFamily: fontBody, fontSize: 11, fill: muted } }} />
                <Tooltip content={<TaxTooltip />} />
                <Area type="stepAfter" dataKey="cityBase" stackId="a" stroke={taxColors.cityBase} fill={taxColors.cityBase} fillOpacity={0.9} name="City base" />
                <Area type="stepAfter" dataKey="tops" stackId="a" stroke={taxColors.tops} fill={taxColors.tops} fillOpacity={0.9} name="TOPS (1997)" />
                <Area type="stepAfter" dataKey="psst" stackId="a" stroke={taxColors.psst} fill={taxColors.psst} fillOpacity={0.9} name="Public Safety (2002)" />
                <Area type="stepAfter" dataKey="roadTax2C" stackId="a" stroke={taxColors.roadTax2C} fill={taxColors.roadTax2C} fillOpacity={0.9} name="2C Road Tax (2016)" />
                <Area type="stepAfter" dataKey="county" stackId="a" stroke={taxColors.county} fill={taxColors.county} fillOpacity={0.75} name="El Paso County" />
                <Area type="stepAfter" dataKey="pprta" stackId="a" stroke={taxColors.pprta} fill={taxColors.pprta} fillOpacity={0.75} name="PPRTA (2005)" />
                <ReferenceLine x={1997} stroke={gold} strokeDasharray="3 3" />
                <ReferenceLine x={2002} stroke={gold} strokeDasharray="3 3" />
                <ReferenceLine x={2005} stroke={gold} strokeDasharray="3 3" />
                <ReferenceLine x={2016} stroke={gold} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-6 text-xs">
              {[
                { c: taxColors.cityBase, l: "City base", note: "Core municipal" },
                { c: taxColors.tops, l: "TOPS", note: "1997 · parks" },
                { c: taxColors.psst, l: "PSST", note: "2002 · CSPD / Fire" },
                { c: taxColors.roadTax2C, l: "2C Road", note: "2016 · potholes" },
                { c: taxColors.county, l: "El Paso Co.", note: "County gen. fund" },
                { c: taxColors.pprta, l: "PPRTA", note: "2005 · regional roads" },
              ].map(k => (
                <div key={k.l} className="flex items-start gap-2">
                  <div style={{ width: 12, height: 12, background: k.c, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ color: ink, fontWeight: 600 }}>{k.l}</div>
                    <div style={{ color: muted }}>{k.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {[
              { year: "1996", rate: "3.10%", sub: "City 2.10 + County 1.00" },
              { year: "2002", rate: "3.50%", sub: "+ TOPS + PSST" },
              { year: "2005", rate: "4.50%", sub: "+ PPRTA" },
              { year: "2016→", rate: "5.35%", sub: "+ 2C Road Tax" },
            ].map((s, i) => (
              <div key={s.year} className="p-4" style={{ background: i === 3 ? forest : "transparent", color: i === 3 ? paper : ink, border: `1px solid ${ink}` }}>
                <div className="num text-sm" style={{ color: i === 3 ? "#D8D4C8" : muted }}>Year {s.year}</div>
                <div className="display text-3xl mt-1" style={{ fontWeight: 500 }}>{s.rate}</div>
                <div className="text-xs mt-1" style={{ color: i === 3 ? "#D8D4C8" : muted }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== NET POSITION CHART ==================== */}
        <section className="mb-16">
          <h2 className="display text-3xl md:text-4xl mb-3" style={{ fontWeight: 500 }}>
            Net position, <span style={{ fontStyle: "italic", color: forest }}>annotated</span>
          </h2>
          <p className="max-w-3xl mb-6 leading-relaxed" style={{ color: "#3A3A38" }}>
            Every dip and jump has a story. Gold dots are voter-approved tax events. Red dots are recessions or structural
            losses. Blue dots are accounting-driven restatements (GASB adoptions, not operational problems). Hover for detail.
          </p>

          <div className="p-6" style={{ border: `1px solid ${ink}`, background: "#FBFAF5" }}>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={netPositionSeries} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#D8D4C8" />
                <XAxis dataKey="year" stroke={ink} tick={{ fontFamily: fontMono, fontSize: 11 }} />
                <YAxis stroke={ink} tick={{ fontFamily: fontMono, fontSize: 11 }}
                  tickFormatter={(v) => "$" + (v / 1e9).toFixed(1) + "B"}
                  label={{ value: "Net position", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fontFamily: fontBody, fontSize: 11, fill: muted } }} />
                <Tooltip content={<NPTooltip />} />
                <Line type="monotone" dataKey="np" stroke={forest} strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: forest }} />
                {netPositionSeries.filter(d => d.event).map(d => (
                  <ReferenceDot key={d.year} x={d.year} y={d.np} r={6}
                    fill={eventColors[d.eventType] || gold} stroke={paper} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap gap-5 mt-4 text-xs">
              <span className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: eventColors.recession }} />
                <span>Recession / impairment</span>
              </span>
              <span className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: eventColors.structural }} />
                <span>Structural change</span>
              </span>
              <span className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: eventColors.accounting }} />
                <span>GASB / accounting</span>
              </span>
              <span className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: eventColors.tax }} />
                <span>Voter-approved tax</span>
              </span>
              <span className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: eventColors.rebound }} />
                <span>Rebound</span>
              </span>
            </div>
          </div>
        </section>

        {/* ==================== YEAR SELECTOR ==================== */}
        <section className="mb-16">
          <h2 className="display text-3xl md:text-4xl mb-3" style={{ fontWeight: 500 }}>
            Drill into <span style={{ fontStyle: "italic", color: forest }}>any year</span>
          </h2>
          <p className="max-w-3xl mb-6 leading-relaxed" style={{ color: "#3A3A38" }}>
            Pick a year. Everything about that year's state of affairs — net position, sales tax stack at that moment,
            YoY delta, narrative — loads below.
          </p>

          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="uppercase tracking-widest text-xs" style={{ color: muted, letterSpacing: "0.15em" }}>
              Fiscal year
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(+e.target.value)}
              className="num px-5 py-3 text-xl"
              style={{
                background: paper,
                color: ink,
                border: `1.5px solid ${ink}`,
                fontFamily: fontMono,
                fontWeight: 500,
                minWidth: 120,
                cursor: "pointer",
              }}
            >
              {netPositionSeries.slice().reverse().map(r => (
                <option key={r.year} value={r.year}>{r.year}</option>
              ))}
            </select>
            <div className="flex gap-1 flex-wrap">
              {[2002, 2008, 2012, 2015, 2018, 2020, 2022, 2024].map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className="num px-3 py-2 text-xs transition"
                  style={{
                    background: selectedYear === y ? forest : "transparent",
                    color: selectedYear === y ? paper : ink,
                    border: `1px solid ${ink}`,
                    fontFamily: fontMono,
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: ink }}>
            {/* Net position panel */}
            <div className="p-6" style={{ background: paper }}>
              <div className="uppercase tracking-widest text-xs mb-2" style={{ color: muted, letterSpacing: "0.15em" }}>
                Net position
              </div>
              <div className="display text-4xl" style={{ color: forest, fontWeight: 500 }}>
                {fmtB(selectedRow.np)}
              </div>
              <div className="num text-xs mt-1" style={{ color: muted }}>
                {fmtFull(selectedRow.np)}
              </div>
              {selectedRow.yoy !== null && (
                <div
                  className="num text-lg mt-4 inline-block px-3 py-1"
                  style={{
                    background: selectedRow.yoy < 0 ? recession : forest,
                    color: paper,
                  }}
                >
                  {selectedRow.yoy >= 0 ? "+" : ""}{selectedRow.yoy}% YoY
                </div>
              )}
            </div>

            {/* Tax stack panel */}
            <div className="p-6" style={{ background: paper }}>
              <div className="uppercase tracking-widest text-xs mb-2" style={{ color: muted, letterSpacing: "0.15em" }}>
                Sales tax stack
              </div>
              <div className="display text-4xl" style={{ color: forest, fontWeight: 500 }}>
                {selectedTax ? selectedTax.total.toFixed(2) + "%" : "—"}
              </div>
              <div className="num text-xs mt-1" style={{ color: muted }}>Total direct + overlapping</div>
              {selectedTax && (
                <div className="mt-4 space-y-1 text-xs num" style={{ color: ink }}>
                  <div>City base · <span style={{ color: muted }}>{selectedTax.cityBase.toFixed(2)}%</span></div>
                  {selectedTax.tops > 0 && <div>TOPS · <span style={{ color: muted }}>{selectedTax.tops.toFixed(2)}%</span></div>}
                  {selectedTax.psst > 0 && <div>PSST · <span style={{ color: muted }}>{selectedTax.psst.toFixed(2)}%</span></div>}
                  {selectedTax.roadTax2C > 0 && <div>2C Road · <span style={{ color: muted }}>{selectedTax.roadTax2C.toFixed(2)}%</span></div>}
                  <div>El Paso Co. · <span style={{ color: muted }}>{selectedTax.county.toFixed(2)}%</span></div>
                  {selectedTax.pprta > 0 && <div>PPRTA · <span style={{ color: muted }}>{selectedTax.pprta.toFixed(2)}%</span></div>}
                </div>
              )}
            </div>

            {/* Event / narrative panel */}
            <div className="p-6" style={{ background: selectedRow.event ? "#EDE8D8" : paper }}>
              <div className="uppercase tracking-widest text-xs mb-2" style={{ color: muted, letterSpacing: "0.15em" }}>
                What happened
              </div>
              {selectedRow.event ? (
                <>
                  <div
                    className="text-xs uppercase tracking-wider mb-2 inline-block px-2 py-1"
                    style={{
                      background: eventColors[selectedRow.eventType] || muted,
                      color: paper,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {selectedRow.eventType || "event"}
                  </div>
                  <p
                    className="leading-relaxed"
                    style={{
                      fontFamily: fontDisplay,
                      fontSize: 18,
                      lineHeight: 1.4,
                      color: ink,
                      fontStyle: "italic",
                    }}
                  >
                    {selectedRow.event}
                  </p>
                </>
              ) : (
                <p className="italic" style={{ color: muted, fontFamily: fontDisplay, fontSize: 16 }}>
                  An unremarkable year. Steady growth, no structural changes, no GASB adoptions.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ==================== FACT-CHECK TABLE ==================== */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
            <h2 className="display text-3xl md:text-4xl" style={{ fontWeight: 500 }}>
              Every year, <span style={{ fontStyle: "italic", color: forest }}>for the record</span>
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search year or event..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="px-3 py-2 text-sm"
                style={{
                  background: paper,
                  border: `1px solid ${ink}`,
                  color: ink,
                  fontFamily: fontBody,
                  minWidth: 220,
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto" style={{ border: `1px solid ${ink}` }}>
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: ink, color: paper }}>
                  {[
                    { key: "year", label: "FY" },
                    { key: "np", label: "Net Position" },
                    { key: "yoy", label: "YoY %" },
                    { key: "event", label: "Notes" },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => setTableSort({
                        key: col.key,
                        dir: tableSort.key === col.key && tableSort.dir === "asc" ? "desc" : "asc"
                      })}
                      className="text-left px-4 py-3 uppercase tracking-widest text-xs cursor-pointer"
                      style={{ letterSpacing: "0.15em", fontWeight: 500 }}
                    >
                      {col.label}
                      {tableSort.key === col.key && (
                        <span className="ml-1">{tableSort.dir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTable.map((r, i) => (
                  <tr
                    key={r.year}
                    onClick={() => setSelectedYear(r.year)}
                    style={{
                      background: r.year === selectedYear ? "#EDE8D8" : (i % 2 === 0 ? paper : "#FBFAF5"),
                      cursor: "pointer",
                      borderBottom: `1px solid #E8E4D8`,
                    }}
                  >
                    <td className="num px-4 py-3" style={{ fontWeight: 600, color: ink }}>{r.year}</td>
                    <td className="num px-4 py-3" style={{ color: forest }}>{fmtFull(r.np)}</td>
                    <td className="num px-4 py-3" style={{ color: r.yoy === null ? muted : r.yoy < 0 ? recession : ink }}>
                      {r.yoy === null ? "—" : (r.yoy >= 0 ? "+" : "") + r.yoy + "%"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#3A3A38" }}>{r.event || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs mt-3" style={{ color: muted, fontStyle: "italic" }}>
            {sortedTable.length} of {netPositionSeries.length} rows · click a row to open its detail panel above · click a header to sort
          </div>
        </section>

        {/* ==================== SALES TAX DOLLARS ==================== */}
        <section className="mb-16">
          <h2 className="display text-3xl md:text-4xl mb-3" style={{ fontWeight: 500 }}>
            Sales tax <span style={{ fontStyle: "italic", color: forest }}>collected</span> (city only)
          </h2>
          <p className="max-w-3xl mb-6 leading-relaxed" style={{ color: "#3A3A38" }}>
            The dollar view of city sales tax receipts, 2004–2024. Notice the Great Recession valley in 2008–2009,
            the steady recovery 2010–2019, the COVID flatline in 2020, the abrupt 24% jump in 2021 (post-pandemic spending +
            the 2C tax compounding), and the budget miss in 2024.
          </p>

          <div className="p-6" style={{ border: `1px solid ${ink}`, background: "#FBFAF5" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesTaxDollars} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#D8D4C8" />
                <XAxis dataKey="year" stroke={ink} tick={{ fontFamily: fontMono, fontSize: 11 }} />
                <YAxis stroke={ink} tick={{ fontFamily: fontMono, fontSize: 11 }}
                  tickFormatter={(v) => "$" + v + "M"} />
                <Tooltip
                  contentStyle={{ background: paper, border: `1px solid ${ink}`, fontFamily: fontBody }}
                  formatter={(v) => ["$" + v + "M", "Sales tax"]}
                />
                <Bar dataKey="amount" fill={forest} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="pt-8 border-t" style={{ borderColor: ink }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="uppercase tracking-widest text-xs mb-3" style={{ color: muted, letterSpacing: "0.15em" }}>
                Data provenance
              </div>
              <p style={{ color: "#3A3A38", lineHeight: 1.6 }}>
                All values traced to the city's own audited Comprehensive Annual Financial Reports (2002–2020) and Annual
                Comprehensive Financial Reports (2021–2024). Two extraction errors were caught in the verification pass
                and documented in the correction log.
              </p>
            </div>
            <div>
              <div className="uppercase tracking-widest text-xs mb-3" style={{ color: muted, letterSpacing: "0.15em" }}>
                Open loops
              </div>
              <p style={{ color: "#3A3A38", lineHeight: 1.6 }}>
                Colorado Springs Utilities standalone financial statements have not yet been ingested. The placeholder schema
                is waiting; service-line detail (electric / gas / water / wastewater) will populate when those filings arrive.
              </p>
            </div>
            <div>
              <div className="uppercase tracking-widest text-xs mb-3" style={{ color: muted, letterSpacing: "0.15em" }}>
                Structural floor
              </div>
              <p style={{ color: "#3A3A38", lineHeight: 1.6 }}>
                The series begins in 2002 because that's when the city adopted GASB 34. Pre-2002 data exists only in fund-level
                format and is not comparable. This is documented in the city's own 2005 CAFR Table 1 footnote.
              </p>
            </div>
          </div>
          <div className="mt-10 text-xs" style={{ color: muted }}>
            Civic Jira · Financial Module · A ticket lives on a parcel · Every PDF becomes searchable text · Every citizen can see the progression of anything that affects their address, in plain language.
          </div>
        </footer>
      </div>
    </div>
  );
}
