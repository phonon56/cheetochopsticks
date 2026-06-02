# Civic Records

A parcel-keyed civic record system. Search a parcel ID, address, or street name
and see every public record attached to that location — permits, projects,
service requests, meeting items, financial allocations — in one place, in
chronological order, in plain language.

Built as a system of presentation on top of existing public data sources,
not a system of record. The data stays where it lives; this is the layer
that reveals what's already there.

## What this is

The starter for a working prototype of the civic-Jira concept. The current
build is intentionally minimal: parcels, records, documents, and a
parcel-centric search and detail view. Everything else (meetings, financials,
notifications, public-facing plain-language layer) is downstream of getting
the foundation right.

## Why this lives in a different stack from the parent repo

The parent repository (`cheetochopsticks/`) is an Eleventy static site —
Markdown + Nunjucks + a small JS sprinkle, built to flat HTML and served
by Cloudflare Pages. It's a presentation layer: microsites, dashboards,
ADA-compliant document mirrors, jurisdiction finder. No database, no
server-side rendering, no background jobs.

This subdirectory is the opposite shape on purpose:

| Concern              | Parent (`cheetochopsticks/`)        | `civic_records/`                          |
| -------------------- | ----------------------------------- | ----------------------------------------- |
| Render model         | Static HTML, built ahead of time    | Server-rendered Django views + REST API   |
| Data                 | Hand-curated content in the repo    | Parcels + records ingested from live APIs |
| Spatial queries      | Not needed                          | PostGIS — point/polygon/intersection      |
| Background work      | None                                | Periodic ingest jobs against public APIs  |
| Persistence          | None (the repo *is* the data)       | PostgreSQL 16 + GIS extensions            |
| Admin                | Hand-edit Markdown                  | Django admin for record entry             |
| Deploy target        | Cloudflare Pages                    | A real host (Fly/Railway/Render/VPS)      |

Neither stack would do the other's job well — Eleventy can't run spatial
queries against a quarter-million parcels, and Django would be overkill
for a static microsite. They live in the same repo because they're parts
of the same civic-tech effort: the static site is the public-facing
exploration and accountability layer, and `civic_records/` is the data
backbone that will eventually power a parcel-centric public view at a
separate URL or subdomain.

If/when this grows beyond prototype, it will move to either its own
repository or a git submodule; for now, one repo, one push, one place
to look.

## What's in the box

- **Django 5 + GeoDjango** application
- **PostgreSQL 16 + PostGIS 3** database
- **Leaflet** map frontend, served from Django templates
- **Docker Compose** for one-command local development
- Sample data loader for a small set of El Paso County parcels
- Sample records seeded from public sources (BoardDocs, 2C paving list,
  GoCOS export format)
- Django admin interface for entering and editing records without
  building forms

## Quick start

Prereqs: Docker Desktop installed and running.

```bash
git clone <this-repo>
cd civic_records
cp .env.example .env
docker compose up --build
```

In a separate terminal once the containers are up:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py loaddata fixtures/sample_data.json
```

Then open:

- `http://localhost:8000/` — the parcel search interface
- `http://localhost:8000/admin/` — the Django admin for record entry
- `http://localhost:8000/parcel/6401303008/` — a sample parcel detail view

## Architecture, briefly

- `parcels/` — Parcel model and views. Parcels are polygons with a stable
  parcel ID. Everything else joins on parcel ID.
- `records/` — Record model and views. A Record is anything that happens
  on a parcel — permit, project ticket, service request, meeting item.
  Records have type, status, owner, history, documents, and can link to
  other records.
- `documents/` — Document model. PDFs and other files attached to records,
  preserved as originals with extracted text indexed for search.
- `config/` — Django settings, URL routing, WSGI/ASGI entry points.
- `frontend/` — Templates and static assets (CSS, JS, Leaflet integration).
- `fixtures/` — Sample data for development.
- `scripts/` — Data import scripts for real public sources.

## The data model

```
Parcel
├── parcel_id          (TextField, unique, primary lookup key)
├── address            (TextField, optional human-readable)
├── geometry           (PolygonField, PostGIS)
├── jurisdiction       (city / county / shared)
└── council_district   (FK, optional)

Record
├── record_id          (TextField, unique)
├── parcel             (FK → Parcel)
├── record_type        (permit / project / request / meeting_item / financial)
├── title              (TextField)
├── status             (TextField, with history)
├── owner_department   (TextField)
├── created_at         (DateTimeField)
├── updated_at         (DateTimeField)
├── plain_summary      (TextField, AI-generated or human-edited)
├── connected_records  (M2M → Record, self-referential)
└── documents          (FK reverse from Document)

RecordHistory
├── record              (FK → Record)
├── from_status         (TextField)
├── to_status           (TextField)
├── changed_at          (DateTimeField)
├── changed_by          (TextField)
└── note                (TextField)

Document
├── record              (FK → Record)
├── file                (FileField)
├── filename            (TextField)
├── extracted_text      (TextField, indexed for full-text search)
├── document_type       (pdf / image / other)
└── uploaded_at         (DateTimeField)
```

Every search — by parcel ID, by address, by free text — resolves to a
Parcel, and the Parcel detail view shows all Records attached to that
Parcel in chronological order.

## Data sources

Every record in the system originates from a public source. Nothing
proprietary, nothing scraped from authenticated pages, nothing behind
a paywall. The list below is what the management commands under
`*/management/commands/ingest_*.py` and `enrich_*.py` actually pull from:

### Spatial / parcel data

- **El Paso County parcel polygons** — ArcGIS FeatureServer published
  on the County's open-data hub.
  https://opendata-elpasoco.hub.arcgis.com/datasets/0e616418d0824212a90fcc2b9ac7fbf2_0
  Loader: `parcels/management/commands/ingest_epc_parcels.py`
- **El Paso County Assessor** — per-parcel detail (owner, valuation,
  improvements, land use code) for enrichment.
  https://property.spatialest.com/co/elpaso/
  Enricher: `parcels/management/commands/enrich_epc_assessor.py`

### City of Colorado Springs

- **City Council Legistar API** — agendas, minutes, ordinances, votes.
  https://webapi.legistar.com/v1/coloradosprings/
  Loader: `records/management/commands/ingest_cos_legistar.py`
- **Procurement solicitations** — open RFPs / bids / sole-source notices.
  https://coloradosprings.gov/solicitations
  Loader: `records/management/commands/ingest_cos_solicitations.py`
- **Contract awards** — awarded procurement contracts.
  https://coloradosprings.gov/procurement-services/page/contract-award-information
  Loader: `records/management/commands/ingest_cos_awards.py`
- **Capital projects (EngageCOS)** — active capital projects published
  by the City.
  https://coloradosprings.gov/projects
  Loader: `projects/management/commands/ingest_cos_projects.py`

### Police

- **CSPD open data (Socrata)** — incident data, calls for service,
  arrests, use of force.
  https://policedata.coloradosprings.gov
  Loader: `records/management/commands/ingest_cspd_socrata.py`

### Meetings / agendas (multi-jurisdiction)

- **AgendaSuite** — multi-tenant agenda system used by the El Paso
  County BOCC, several special districts, and a number of Colorado
  cities and counties.
  https://www.agendasuite.org/iip/{tenant}/
  Loader: `records/management/commands/ingest_agendasuite.py`
- **BoardDocs** — meeting documents for school boards and a number of
  Colorado public agencies. Pull pattern documented in
  `records/ingest_base.py`; integrated via the seed data and the
  agenda-item parcel matcher in `records/parcel_match.py`.
- **2C paving list** — the City's published annual paving program PDF,
  funded by the 2C sales tax. Street segments parse to linestring
  records and join to parcels along the segment.
- **GoCOS** — Colorado Springs service-request system. Sample records
  use the GoCOS export format; live ingest is on the roadmap once the
  export endpoint stabilizes.

### LLM providers (for enrichment, not data)

The `records/llm_client.py` shim is provider-agnostic and selects at
load time via `LLM_PROVIDER`. Used for plain-language summaries and
topic tagging, never as a system of record.

- **Cloudflare Workers AI** (default) — REST API, cheap, deploys
  alongside the existing Cloudflare footprint for the parent site.
- **Anthropic Claude** (optional) — selected when stronger reasoning
  is worth the per-call cost. Default model `claude-haiku-4-5`.

Every LLM call is logged to `LLMCallLog` with token counts + USD cost
so the spend is auditable.

## Why this stack

PostgreSQL + PostGIS because everything in civic records is spatial.
Parcels are polygons, tickets are points, streets are linestrings, and
every query you'll ever write is "what's near what" or "what intersects
what." PostGIS does this natively in standard SQL.

Django + GeoDjango because the work is integration-heavy (pulling from
BoardDocs PDFs, GoCOS exports, the County GIS, the 2C paving list),
Python's ETL libraries are unmatched, GeoDjango is purpose-built for
parcel-keyed applications, and the admin interface gives you a free
internal tool for entering test data.

Leaflet because it's free, well-documented, accessible-friendly, and
doesn't require an API key or a build step.

Docker Compose because one command should get you a working environment.

No Next.js, no Redux, no GraphQL, no microservices. The complexity in
civic records is in the data, not the framework.

## Status

Day-zero scaffold. The data model is real and the parcel-centric pattern
works end to end with sample data. Next milestones, in order:

1. Real El Paso County parcel data import (PostGIS shapefile loader)
2. BoardDocs scraper for meeting items, joined on parcel via address
3. 2C paving list parser (PDF → linestring records joined to parcels along
   the segment)
4. GoCOS export importer
5. Plain-language summary layer (AI-assisted, human-reviewable)
6. Public-facing read-only view at a separate URL with WCAG 2.1 AA
   compliance audited from day one

## License

Public benefit. Use it, adapt it, fork it.

## Author

Emma Moore
emma@pivottruenorth.com | 310-913-8931
pivottruenorth.com | cheetochopsticks.com
