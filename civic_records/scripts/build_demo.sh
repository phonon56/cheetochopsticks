#!/usr/bin/env bash
#
# Rebuild the civic_records demo from a clean database.
#
# What this does, in order:
#   1. Apply migrations
#   2. Seed the small fixture parcels + records (9805 Federal Drive, etc.)
#   3. Pull EPC parcels (100 from the public ArcGIS layer)
#   4. Pull EPC AgendaSuite meeting items (since 2026-04-01)
#   5. Pull COS Legistar events + items (since 2026-03-01, limit 5 events)
#   6. Pull COS Solicitations (current open RFPs)
#   7. Pull COS Awards (full table)
#   8. Pull EngageCOS Projects (index-only — fast)
#   9. Run the keyword-based topic tagger on every record
#  10. Backfill Project links via the layered linker
#  11. Mark the top-record-count projects as featured
#
# Usage (from the project root):
#   ./scripts/build_demo.sh            # idempotent; safe to re-run
#   ./scripts/build_demo.sh --reset    # drop + recreate the database first
#
# Total runtime: ~30-60 seconds depending on network. No API keys required.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--reset" ]]; then
    echo "==> Dropping and recreating the database..."
    docker compose exec -T db dropdb -U "${POSTGRES_USER:-civic}" "${POSTGRES_DB:-civic_records}" --if-exists
    docker compose exec -T db createdb -U "${POSTGRES_USER:-civic}" "${POSTGRES_DB:-civic_records}"
fi

mc() {
    echo
    echo "==> $*"
    docker compose exec -T web python manage.py "$@"
}

mc migrate --noinput

echo
echo "==> Seeding fixture data..."
docker compose exec -T web python scripts/seed_demo_data.py

mc ingest_epc_parcels \
    --url "https://gisservices.elpasoco.com/arcgis2/rest/services/HubPublic/Parcels/MapServer/0" \
    --limit 100

mc ingest_agendasuite --since 2026-04-01 --limit 8

mc ingest_cos_legistar --since 2026-03-01 --limit 5

mc ingest_cos_solicitations

mc ingest_cos_awards

mc ingest_cos_projects --no-details

# Heuristic topic tagging (no LLM required)
echo
echo "==> Applying keyword-based topic tags..."
docker compose exec -T web python manage.py shell <<'PYEOF'
from records.models import Record, TopicTag

tags = {t.slug: t for t in TopicTag.objects.all()}

KEYWORD_TAGS = [
    (['council', 'meeting', 'agenda', 'consent', 'resolution honoring',
      'recognizing', 'ratification', 'councilmember', 'minute', 'work session'],
     ['meeting']),
    (['housing', 'residential', 'subdivision', 'replat'],
     ['housing', 'zoning']),
    (['liquor', 'license', 'permit', 'modification of the premises'],
     ['enforcement']),
    (['paving', 'pothole', 'road', 'street', 'traffic', 'public works',
      'asphalt', 'highway', 'corridor', 'extension', 'bridge', 'rehab'],
     ['transportation', 'infrastructure']),
    (['mill levy', 'tax', 'budget', 'allocation', 'fund', 'award',
      'contract', 'vendor', 'consultant', 'procurement'],
     ['finance']),
    (['planning commission', 'planning', 'land use', 'lorson ranch'],
     ['planning', 'development']),
    (['stormwater', 'drainage', 'flood', 'channel', 'levee'],
     ['stormwater']),
    (['utilities', 'water', 'electric', 'sewer', 'gas'], ['utilities']),
    (['park', 'trail', 'recreation', 'open space', 'sports complex',
      'playground', 'master plan'], ['parks']),
    (['historic', 'preservation', 'cultural'], ['planning']),
    (['emergency', 'wildfire', 'disaster', 'fire'],
     ['emergency', 'public-safety']),
    (['ada', 'accessibility', 'accessible'], ['accessibility']),
    (['transit', 'mobility', 'pedestrian', 'bike'], ['transportation']),
    (['airport', 'aviation'], ['transportation', 'infrastructure']),
]

n = 0
for r in Record.objects.all():
    haystack = (r.title + ' ' + r.description + ' ' + r.owner_department).lower()
    chosen = {tags[s] for keywords, slugs in KEYWORD_TAGS
              if any(k in haystack for k in keywords)
              for s in slugs if s in tags}
    if chosen:
        r.topic_tags.set(chosen)
        n += 1
print(f'Tagged {n} records.')
PYEOF

mc relink_projects

# Mark top 5 projects (by linked record count) as featured
echo
echo "==> Selecting featured projects..."
docker compose exec -T web python manage.py shell <<'PYEOF'
from projects.models import Project
from django.db.models import Count

Project.objects.update(featured=False)
top = list(Project.objects.annotate(n=Count('records'))
           .filter(n__gt=0).order_by('-n', 'slug')[:5])
Project.objects.filter(id__in=[p.id for p in top]).update(featured=True)
print(f'Featured: {[p.slug for p in top]}')
PYEOF

echo
echo "==> Demo build complete."
echo "    Visit http://localhost:8000/"
