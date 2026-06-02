"""Serializers for Parcel API responses."""
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Parcel, CouncilDistrict


class CouncilDistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouncilDistrict
        fields = ["district_type", "number", "name", "representative"]


class ParcelSerializer(serializers.ModelSerializer):
    council_district = CouncilDistrictSerializer(read_only=True)
    record_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Parcel
        fields = [
            "parcel_id", "address", "city", "state", "zip_code",
            "jurisdiction", "council_district",
            "acres", "zoning", "record_count",
        ]


class ParcelGeoSerializer(GeoFeatureModelSerializer):
    """GeoJSON-shaped serializer for the map view."""

    council_district = CouncilDistrictSerializer(read_only=True)

    class Meta:
        model = Parcel
        geo_field = "geometry"
        fields = [
            "parcel_id", "address", "jurisdiction",
            "council_district",
        ]
