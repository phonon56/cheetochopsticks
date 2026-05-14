"""Admin registration for projects."""
from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "source", "status",
                    "featured", "record_count", "updated_at")
    list_filter = ("source", "status", "featured", "auto_generated")
    search_fields = ("slug", "title", "description")
    readonly_fields = ("source_hash", "last_synced_at",
                       "created_at", "updated_at")
    filter_horizontal = ("topic_tags", "parcels")
    fieldsets = (
        ("Identity", {
            "fields": ("slug", "title", "description", "status")
        }),
        ("Source", {
            "fields": ("source", "source_id", "source_url",
                       "source_hash", "last_synced_at")
        }),
        ("Visibility", {
            "fields": ("featured", "auto_generated",
                       "approved_by", "approved_at")
        }),
        ("Spatial", {
            "fields": ("extent",)
        }),
        ("Relations", {
            "fields": ("topic_tags", "parcels")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )

    @admin.display(description="Records", ordering="records__count")
    def record_count(self, obj):
        return obj.records.count()
