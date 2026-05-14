"""
Record models.

A Record is anything that happens on a parcel — a permit, project ticket,
service request, meeting agenda item, or financial allocation. Records
share a common structure (ID, type, status, owner, history, documents,
plain-language summary, connected records) regardless of which department
or workflow produced them. This is the "everything is a ticket" pattern
from the original civic-Jira concept.
"""
from django.contrib.gis.db import models
from django.utils import timezone


class TopicTag(models.Model):
    """
    A soft topic tag. Closed taxonomy — new tags require a code change to
    keep the vocabulary tight (avoids "Housing"/"housing"/"affordable-housing"
    drift). Assigned to records by the LLM enrichment pipeline.
    """
    slug = models.SlugField(unique=True, max_length=64)
    label = models.CharField(max_length=128)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["label"]

    def __str__(self):
        return self.label


class Record(models.Model):
    """A single civic record attached to a parcel."""

    RECORD_TYPES = [
        ("permit", "Permit"),
        ("project", "Project"),
        ("request", "Service Request"),
        ("meeting_item", "Meeting Item"),
        ("financial", "Financial Allocation"),
        ("inspection", "Inspection"),
        ("violation", "Violation / Code Enforcement"),
        ("solicitation", "Solicitation / RFP"),
        ("award", "Contract Award"),
        ("milestone", "Project Milestone"),
        ("other", "Other"),
    ]

    STATUSES = [
        ("open", "Open"),
        ("in_review", "In Review"),
        ("in_progress", "In Progress"),
        ("awaiting_action", "Awaiting Action"),
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("closed", "Closed"),
        ("denied", "Denied"),
        ("withdrawn", "Withdrawn"),
    ]

    record_id = models.CharField(
        max_length=64, unique=True, db_index=True,
        help_text="External ID from the originating system, "
                  "or a generated UUID if internal."
    )
    parcel = models.ForeignKey(
        "parcels.Parcel", on_delete=models.PROTECT,
        related_name="records",
        null=True, blank=True,
        help_text="Most records belong to a parcel. Some don't — a city-wide "
                  "policy meeting item, an agency-level financial allocation. "
                  "Null records still appear in jurisdictional views, just not "
                  "on any parcel detail page."
    )
    project = models.ForeignKey(
        "projects.Project", on_delete=models.SET_NULL,
        related_name="records",
        null=True, blank=True,
        help_text="Optional grouping under a multi-event project (capital "
                  "project, planning initiative). Lets us reconstruct the "
                  "RFP → award → milestones lifecycle."
    )
    record_type = models.CharField(max_length=32, choices=RECORD_TYPES)
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUSES, default="open")

    owner_department = models.CharField(
        max_length=128, blank=True,
        help_text="Which department currently owns this record."
    )
    owner_person = models.CharField(max_length=128, blank=True)

    source_system = models.CharField(
        max_length=64, blank=True, db_index=True,
        help_text="Where this record was sourced from "
                  "(epc_parcels, cspd_socrata, accela_cos, agendasuite, etc.)"
    )
    source_id = models.CharField(
        max_length=128, blank=True,
        help_text="The record's ID inside the source system. "
                  "Together with source_system, uniquely identifies an upstream row "
                  "for upsert. Distinct from record_id, which is our internal key."
    )
    source_url = models.URLField(blank=True, max_length=1024)
    source_hash = models.CharField(
        max_length=64, blank=True,
        help_text="SHA-256 of the normalized source payload at last ingest. "
                  "Used to skip unchanged rows and gate LLM enrichment."
    )
    last_synced_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the ingest pipeline last fetched this record from source. "
                  "Distinct from updated_at, which fires on any field change."
    )
    enriched_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the LLM enrichment pipeline last generated "
                  "plain_summary + topic_tags for this record."
    )

    plain_summary = models.TextField(
        blank=True,
        help_text="Human-readable, jargon-free summary. "
                  "AI-drafted, human-reviewed."
    )

    topic_tags = models.ManyToManyField(
        TopicTag, blank=True, related_name="records",
        help_text="Soft topic tags assigned by enrichment. Closed taxonomy."
    )

    connected_records = models.ManyToManyField(
        "self", blank=True, symmetrical=True,
        help_text="Other records linked to this one."
    )

    # Optional point location, more precise than the parent parcel's
    # centroid. Useful for service requests where the exact GPS point
    # is meaningful (e.g., a specific pothole within a parcel).
    point_location = models.PointField(srid=4326, null=True, blank=True)

    occurred_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the underlying event happened (e.g., the meeting "
                  "date, the permit application date). May differ from "
                  "created_at, which is when the record entered this system."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["record_type", "status"]),
            models.Index(fields=["occurred_at"]),
            models.Index(fields=["source_system", "source_id"]),
        ]
        constraints = [
            # Upsert key: (source_system, source_id) is unique whenever both
            # are non-empty. Manual records (no source) are not constrained.
            models.UniqueConstraint(
                fields=["source_system", "source_id"],
                condition=~models.Q(source_system="") & ~models.Q(source_id=""),
                name="uniq_source_system_id",
            ),
        ]

    def __str__(self):
        return f"[{self.get_record_type_display()}] {self.title}"

    def record_status_change(self, new_status, changed_by="", note=""):
        """Capture a status transition in RecordHistory."""
        if new_status == self.status:
            return None
        history = RecordHistory.objects.create(
            record=self,
            from_status=self.status,
            to_status=new_status,
            changed_by=changed_by,
            note=note,
        )
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])
        return history


class RecordHistory(models.Model):
    """An entry in the status-change trail for a Record."""

    record = models.ForeignKey(
        Record, on_delete=models.CASCADE, related_name="history"
    )
    from_status = models.CharField(max_length=32, blank=True)
    to_status = models.CharField(max_length=32)
    changed_at = models.DateTimeField(default=timezone.now)
    changed_by = models.CharField(max_length=128, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-changed_at"]
        verbose_name_plural = "Record history"

    def __str__(self):
        return f"{self.record.record_id}: {self.from_status} → {self.to_status}"


class IngestRun(models.Model):
    """
    One execution of a source ingest. Persistent observability for the
    pipeline — admin can see "Accela hasn't synced in 18h" or "EPC parcels
    failed last night with X error" without grepping logs.
    """

    STATUSES = [
        ("running",  "Running"),
        ("success",  "Success"),
        ("partial",  "Partial (some rows failed)"),
        ("failed",   "Failed"),
    ]

    source = models.CharField(
        max_length=64, db_index=True,
        help_text="Source identifier — matches Record.source_system "
                  "(e.g., 'epc_parcels', 'cspd_socrata')."
    )
    started_at  = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)
    status      = models.CharField(max_length=16, choices=STATUSES, default="running")

    records_created = models.PositiveIntegerField(default=0)
    records_updated = models.PositiveIntegerField(default=0)
    records_skipped = models.PositiveIntegerField(default=0)
    records_failed  = models.PositiveIntegerField(default=0)

    error = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["source", "-started_at"])]

    def __str__(self):
        return f"{self.source} @ {self.started_at:%Y-%m-%d %H:%M} [{self.status}]"

    @property
    def duration_seconds(self):
        if not self.finished_at:
            return None
        return (self.finished_at - self.started_at).total_seconds()

    def mark_finished(self, status="success", error=""):
        self.finished_at = timezone.now()
        self.status = status
        if error:
            self.error = error
        self.save(update_fields=["finished_at", "status", "error"])


class LLMCallLog(models.Model):
    """
    One LLM API call. Persists token usage so we can see spend trends and
    spot regressions ("the new prompt doubled output tokens"). Aggregated
    in admin via list_filter on purpose + day.
    """

    PURPOSES = [
        ("enrich",            "Record enrichment"),
        ("taxonomy_discover", "Source taxonomy discovery"),
        ("other",             "Other"),
    ]

    purpose = models.CharField(max_length=32, choices=PURPOSES, db_index=True)
    model = models.CharField(max_length=64, blank=True)
    record = models.ForeignKey(
        Record, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="llm_calls",
    )

    input_tokens  = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    cache_read_tokens   = models.PositiveIntegerField(default=0)
    cache_write_tokens  = models.PositiveIntegerField(default=0)

    cost_usd = models.DecimalField(
        max_digits=10, decimal_places=6, null=True, blank=True,
        help_text="Estimated cost in USD, computed from token counts at ingest time."
    )

    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["purpose", "-created_at"])]

    def __str__(self):
        return f"{self.purpose} {self.created_at:%Y-%m-%d %H:%M} (${self.cost_usd or 0:.4f})"
