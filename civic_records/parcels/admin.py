"""Admin registration for parcels with the GeoDjango map widget."""
from django.contrib.gis import admin
from .models import Parcel, CouncilDistrict


@admin.register(Parcel)
class ParcelAdmin(admin.GISModelAdmin):
    list_display = ("parcel_id", "address", "jurisdiction",
                    "council_district", "record_count", "latest_activity")
    list_filter = ("jurisdiction", "council_district")
    search_fields = ("parcel_id", "address")
    readonly_fields = ("created_at", "updated_at", "centroid")
    fieldsets = (
        ("Identity", {
            "fields": ("parcel_id", "address", "city", "state", "zip_code")
        }),
        ("Jurisdiction", {
            "fields": ("jurisdiction", "council_district")
        }),
        ("Geometry", {
            "fields": ("geometry", "centroid")
        }),
        ("Attributes", {
            "fields": ("acres", "zoning")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(CouncilDistrict)
class CouncilDistrictAdmin(admin.GISModelAdmin):
    list_display = ("district_type", "number", "name", "representative")
    list_filter = ("district_type",)
    search_fields = ("number", "name", "representative")
