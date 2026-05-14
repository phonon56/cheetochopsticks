"""Admin registration for records."""
from django.contrib import admin
from django.utils.html import format_html

from .models import IngestRun, LLMCallLog, Record, RecordHistory, TopicTag


class RecordHistoryInline(admin.TabularInline):
    model = RecordHistory
    extra = 0
    readonly_fields = ("changed_at",)


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = (
        "record_id", "record_type", "title", "status",
        "parcel", "source_system", "enriched_at", "updated_at",
    )
    list_filter = (
        "record_type", "status", "source_system",
        "owner_department", "topic_tags",
    )
    search_fields = (
        "record_id", "source_id", "title", "description",
        "parcel__parcel_id", "parcel__address",
    )
    raw_id_fields = ("parcel",)
    filter_horizontal = ("connected_records", "topic_tags")
    readonly_fields = ("created_at", "updated_at",
                       "last_synced_at", "enriched_at", "source_hash")
    inlines = [RecordHistoryInline]
    fieldsets = (
        ("Identity", {
            "fields": ("record_id", "record_type", "title", "description")
        }),
        ("Location", {
            "fields": ("parcel", "point_location")
        }),
        ("Status & Ownership", {
            "fields": ("status", "owner_department", "owner_person")
        }),
        ("Source", {
            "fields": ("source_system", "source_id", "source_url",
                       "source_hash", "last_synced_at")
        }),
        ("Public-facing", {
            "fields": ("plain_summary", "topic_tags", "enriched_at")
        }),
        ("Connections", {
            "fields": ("connected_records",)
        }),
        ("Timestamps", {
            "fields": ("occurred_at", "created_at", "updated_at")
        }),
    )


@admin.register(RecordHistory)
class RecordHistoryAdmin(admin.ModelAdmin):
    list_display = ("record", "from_status", "to_status",
                    "changed_at", "changed_by")
    list_filter = ("from_status", "to_status")
    readonly_fields = ("changed_at",)


@admin.register(TopicTag)
class TopicTagAdmin(admin.ModelAdmin):
    list_display = ("label", "slug", "record_count")
    search_fields = ("slug", "label", "description")
    prepopulated_fields = {"slug": ("label",)}

    @admin.display(description="Records", ordering="records__count")
    def record_count(self, obj):
        return obj.records.count()


@admin.register(IngestRun)
class IngestRunAdmin(admin.ModelAdmin):
    list_display = (
        "source", "status_badge", "started_at", "duration_seconds",
        "records_created", "records_updated",
        "records_skipped", "records_failed",
    )
    list_filter = ("source", "status")
    readonly_fields = ("source", "started_at", "finished_at", "status",
                       "records_created", "records_updated",
                       "records_skipped", "records_failed", "error", "notes")
    search_fields = ("source", "error", "notes")
    date_hierarchy = "started_at"

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        colors = {
            "running": "#9a7e30",  # gold-dark
            "success": "#065f46",  # green
            "partial": "#d97706",  # warn
            "failed":  "#b91c1c",  # red
        }
        color = colors.get(obj.status, "#777")
        return format_html(
            '<span style="padding: 2px 8px; background: {}; color: white; '
            'border-radius: 3px; font-size: 11px; font-weight: 600;">{}</span>',
            color, obj.get_status_display()
        )


@admin.register(LLMCallLog)
class LLMCallLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "purpose", "model", "record",
                    "input_tokens", "output_tokens",
                    "cache_read_tokens", "cost_usd")
    list_filter = ("purpose", "model")
    search_fields = ("record__record_id", "error")
    readonly_fields = tuple(
        f.name for f in LLMCallLog._meta.fields
    )
    date_hierarchy = "created_at"
