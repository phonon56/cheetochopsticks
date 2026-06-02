"""
Parcel models.

The Parcel is the foundational entity. Every record in the system —
permit, project, service request, meeting item, financial allocation —
joins on parcel_id. Parcels are spatial polygons sourced from the
El Paso County Assessor or Pikes Peak Regional Building Department.
"""
from django.contrib.gis.db import models


class CouncilDistrict(models.Model):
    """
    A council or commissioner district. A parcel can sit in multiple
    overlapping districts (city council, BOCC, school board, etc.) but
    for the first cut we keep it simple with one district per type.
    """

    DISTRICT_TYPES = [
        ("city_council", "City Council"),
        ("bocc", "Board of County Commissioners"),
        ("school_board", "School Board"),
    ]

    district_type = models.CharField(max_length=32, choices=DISTRICT_TYPES)
    number = models.CharField(max_length=8)
    name = models.CharField(max_length=128, blank=True)
    representative = models.CharField(max_length=128, blank=True)
    geometry = models.MultiPolygonField(srid=4326, null=True, blank=True)

    class Meta:
        unique_together = [("district_type", "number")]
        ordering = ["district_type", "number"]

    def __str__(self):
        return f"{self.get_district_type_display()} District {self.number}"


class Parcel(models.Model):
    """
    A parcel of land. The unit of accountability in this system.

    parcel_id is the canonical key. Addresses change; parcel IDs are
    stable through subdivision, ownership change, and re-zoning. Every
    Record in the system joins on this field.
    """

    JURISDICTIONS = [
        ("city", "City of Colorado Springs"),
        ("county", "Unincorporated El Paso County"),
        ("shared", "Shared / IGA"),
    ]

    parcel_id = models.CharField(
        max_length=32, unique=True, db_index=True,
        help_text="Assessor parcel ID. Canonical key across all records."
    )
    address = models.CharField(
        max_length=255, blank=True,
        help_text="Primary human-readable address, if any."
    )
    city = models.CharField(max_length=64, blank=True, default="Colorado Springs")
    state = models.CharField(max_length=2, blank=True, default="CO")
    zip_code = models.CharField(max_length=10, blank=True)

    jurisdiction = models.CharField(
        max_length=16, choices=JURISDICTIONS, default="city"
    )
    council_district = models.ForeignKey(
        CouncilDistrict, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="parcels"
    )

    geometry = models.PolygonField(srid=4326, null=True, blank=True)
    centroid = models.PointField(srid=4326, null=True, blank=True)

    acres = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True
    )
    zoning = models.CharField(max_length=32, blank=True)

    # ── Assessor enrichment (populated by enrich_epc_assessor) ───────────
    # The EPC parcels FeatureServer gives geometry + parcel_id only.
    # Owner, valuation, and characteristic data live in the Spatialest SPA
    # at property.spatialest.com/co/elpaso. last_assessed_at tracks when
    # we last scraped, so the enrich command can skip fresh parcels.
    owner_name = models.CharField(max_length=256, blank=True)
    owner_mailing_address = models.CharField(max_length=256, blank=True)
    market_value = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    assessed_value = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    year_built = models.PositiveIntegerField(null=True, blank=True)
    property_class = models.CharField(max_length=64, blank=True)
    last_assessed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["parcel_id"]

    def __str__(self):
        if self.address:
            return f"{self.parcel_id} — {self.address}"
        return self.parcel_id

    def save(self, *args, **kwargs):
        # Derive centroid from polygon on save, so spatial point queries
        # are fast without recomputing geometry on every request.
        if self.geometry and not self.centroid:
            self.centroid = self.geometry.centroid
        super().save(*args, **kwargs)

    @property
    def record_count(self):
        return self.records.count()

    @property
    def latest_activity(self):
        latest = self.records.order_by("-updated_at").first()
        return latest.updated_at if latest else self.created_at
