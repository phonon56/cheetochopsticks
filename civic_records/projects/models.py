"""
Project models.

A Project is a multi-event city or county initiative — a capital project,
a planning process, a policy rollout. It owns multiple Records spanning
the lifecycle: solicitation → award → council approvals → milestones →
completion.

Why a separate model rather than just a Record type:
- A project's *lifecycle* matters as much as any single event. Grouping
  records under a project gives us a /project/{slug}/ page that shows
  the whole arc instead of forcing users to reconstruct it from search.
- Many records (RFP, award, multiple council items) refer to the same
  underlying initiative; tying them via a Project FK is cleaner than
  M2M `connected_records`.
- Projects often span many parcels (a road corridor, a watershed). The
  M2M to Parcel handles that without polluting the per-Record FK.
"""
from django.contrib.gis.db import models


class Project(models.Model):
    """
    A grouping for related civic records that together represent one
    initiative. Sourced from EngageCOS by default, but can be hand-curated
    in admin or auto-detected by clustering (later).
    """

    SOURCES = [
        ("engagecos",   "EngageCOS (City of Colorado Springs)"),
        ("epc",         "El Paso County"),
        ("manual",      "Manually curated"),
        ("auto",        "Auto-detected (pending review)"),
    ]

    slug = models.SlugField(
        unique=True, max_length=128,
        help_text="URL-safe ID. EngageCOS projects use the page slug "
                  "(e.g., 'PowersExtension'); manual projects can use any."
    )
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)

    source = models.CharField(max_length=32, choices=SOURCES, default="manual",
                              db_index=True)
    source_url = models.URLField(blank=True, max_length=1024)
    source_id = models.CharField(max_length=128, blank=True)
    source_hash = models.CharField(max_length=64, blank=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    # Source's own status string ("Planning Phase", "In Progress", "Complete").
    # Free-form because every source uses different language; we don't try
    # to coerce into a closed taxonomy.
    status = models.CharField(max_length=64, blank=True, db_index=True)

    # Spatial extent. Polygon for area projects, MultiLineString for road
    # corridors, Point for single-site. Generic GeometryField accepts any.
    extent = models.GeometryField(srid=4326, null=True, blank=True)

    featured = models.BooleanField(
        default=False,
        help_text="Surface on the homepage initiative chip row."
    )
    auto_generated = models.BooleanField(
        default=False,
        help_text="Created by the auto-clustering pipeline. Requires "
                  "human approval before going public."
    )
    approved_by = models.CharField(max_length=128, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    topic_tags = models.ManyToManyField(
        "records.TopicTag", blank=True, related_name="projects",
    )
    parcels = models.ManyToManyField(
        "parcels.Parcel", blank=True, related_name="projects",
        help_text="A corridor project touches many parcels. M2M lets us "
                  "answer 'show me every project on this parcel'."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-featured", "-updated_at"]
        indexes = [
            models.Index(fields=["source", "status"]),
            models.Index(fields=["featured", "-updated_at"]),
        ]

    def __str__(self):
        return self.title or self.slug
