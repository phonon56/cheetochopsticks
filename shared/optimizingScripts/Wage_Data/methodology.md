# Compared to What — Dashboard Methodology

**Project:** El Paso County vs. Denver County wage and incentive comparison dashboard
**Last updated:** April 2026
**Status:** Data layer in development

---

## What this dashboard is trying to show

Three comparisons, on one page:

1. **Median wage trend by county** — has the gap between El Paso County and Denver County wages widened, narrowed, or held over the last five years?
2. **Total public investment per job** — when stacking every layer of incentives (state JGI, Enterprise Zone, county/city abatements, EDC operating contributions), what does the public actually pay per job created?
3. **Housing affordability ratio** — median listing price divided by median wage, by county, year over year. Are workers being recruited into a region they can afford to live in?

The Chamber publishes the wins. This dashboard publishes the comparison. Neither is wrong by itself; together, they give residents the full picture.

---

## Data sources

### Source 1 — BLS Quarterly Census of Employment and Wages (QCEW)

**What it is:** The federal government's most comprehensive employment and wage dataset. Covers approximately 95% of U.S. jobs (everything covered by unemployment insurance). Published quarterly, free, public.

**Where it lives:** `https://www.bls.gov/cew/` and `https://api.bls.gov/publicAPI/v2/timeseries/data/`

**Series IDs used in this dashboard:**

| Nickname | Series ID | What it measures |
|---|---|---|
| El Paso total weekly wage | `ENU0804140510` | All-industry private avg weekly wage, El Paso County |
| El Paso manufacturing weekly wage | `ENU08041405101023` | Manufacturing supersector avg weekly wage, El Paso County |
| El Paso total employment | `ENU0804110510` | All-industry private employment level, El Paso County |
| Denver total weekly wage | `ENU0803140510` | All-industry private avg weekly wage, Denver County |
| Denver manufacturing weekly wage | `ENU08031405101023` | Manufacturing supersector avg weekly wage, Denver County |
| Denver total employment | `ENU0803110510` | All-industry private employment level, Denver County |

**Series ID format:** `ENU` (QCEW prefix) + 5-digit FIPS code + datatype + size + ownership + industry. The encoding is finicky, which is why the script uses these literal IDs rather than constructing them dynamically.

**Geographic codes:**
- El Paso County, CO: FIPS 08041
- Denver County, CO: FIPS 08031

**Known limitations:**
- QCEW reports *average weekly wage*, not median. The annualized figure (× 52) approximates annual earnings but doesn't account for benefits, equity, or non-wage compensation.
- Aerospace-specific data (NAICS 3364) is not always exposed at the county level in the public API. The dashboard uses the manufacturing supersector (NAICS 1023) as the closest reliable proxy for the defense / aerospace contracting cluster. This understates the wage signal because the supersector includes lower-wage manufacturing roles alongside aerospace.
- Public-tier API access is rate-limited to 25 queries per day per IP address. For higher volume or more reliable access, register for a free key at `https://data.bls.gov/registrationEngine/` (raises the limit to 500/day).
- QCEW data lags by about 6 months — Q4 2024 data published mid-2025.

### Source 2 — Zillow Research (housing affordability)

**What it is:** Median listing price, median sale price, and rent indices by county. Free, downloadable as CSV, updated monthly.

**Where it lives:** `https://www.zillow.com/research/data/`

**Files used:**
- ZHVI All Homes (county-level smoothed) — for median home value trend
- Median Listing Price (county-level) — for the affordability ratio

**Known limitations:**
- Zillow's data covers transactions on or comparable to listings on Zillow's platform. Coverage is good in metro areas, weaker in rural counties.
- Listing prices reflect what sellers ask, not what buyers pay. Sale price is the better measure but lags more.
- Zillow uses its own geographic boundaries that mostly but not always align with FIPS counties.

### Source 3 — Public investment per job (composite)

**What it is:** The stacked total of every public subsidy flowing into recruitment of a specific company. This is the hardest column on the dashboard and the slowest to assemble.

**Components:**

| Layer | Source | Public? |
|---|---|---|
| State Job Growth Incentive Tax Credit (JGI) | OEDIT meeting minutes, Colorado Economic Development Commission | Yes — minutes published monthly |
| State Strategic Fund | OEDIT | Yes |
| Enterprise Zone credits | OEDIT, county EZ administrator | Partial — aggregate published, per-company sometimes redacted |
| Local Deal Closing Fund match | Colorado Springs Chamber & EDC | No — typically not published per project |
| County / city tax abatements | County Clerk, City Clerk records | Yes via CORA |
| Business Personal Property Tax (forgone revenue) | County Assessor | Calculable from company equipment investment, requires CORA |
| EDC operating contributions per project | EDC contracts with county/city | No — aggregate only, requires CORA |

**Methodology note:** Because some layers require CORA requests, the dashboard's public-investment column will publish only what is currently public, with a clear "data still being assembled" indicator on layers awaiting records responses. Transparency about gaps is part of the methodology, not a flaw.

---

## Process

1. Run `bls_smoke_test.py` to confirm API access from your machine.
2. Run `bls_pull.py` — generates three CSV files: raw observations, annualized summary, dashboard-ready wide format.
3. Download Zillow median listing price CSV from `zillow.com/research/data/`, filter to FIPS 08041 and 08031, save as `zillow_listings.csv`.
4. Compile incentive-per-job table from OEDIT minutes (already partially gathered from the Chamber summary). File CORAs for missing layers; note remaining gaps explicitly.
5. Drop the three datasets into the dashboard shell. Charts render automatically.
6. Publish the dashboard, the methodology page, and the underlying CSVs together. All three.

---

## Why methodology gets published next to the dashboard

The Chamber publishes flattering numbers and doesn't show its work. The point of this project isn't to publish less-flattering numbers and not show our work either. The point is to publish honest numbers and show every step.

If a finding is uncomfortable, the methodology lets readers verify it. If a finding is wrong, the methodology lets readers correct it. If the dashboard is later forked by another county, the methodology lets the fork stay accurate.

A dashboard without a methodology is marketing. A dashboard with one is research.

---

## Update cadence

Quarterly. QCEW publishes on a quarterly lag, so re-running the pull script every three months captures the most recent fully-published period. Zillow updates monthly. Incentive data updates whenever new OEDIT minutes are published.

---

## Sources for deeper reading

- BLS QCEW Handbook of Methods: `https://www.bls.gov/opub/hom/cew/`
- BLS Open Data API documentation: `https://www.bls.gov/developers/`
- Colorado Economic Development Commission archive: `https://oedit.colorado.gov/colorado-economic-development-commission`
- Colorado Department of Local Affairs (county demographics): `https://dola.colorado.gov/dlg/`
- Tax Foundation State Business Tax Climate Index: `https://taxfoundation.org/`

---

*Methodology page maintained as part of the Compared to What civic dashboard project. This is research, not legal or financial advice. For questions about the data sources, contact the issuing agencies directly. For questions about the dashboard, see the project repository.*
