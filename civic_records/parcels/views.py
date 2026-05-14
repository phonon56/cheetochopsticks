"""Parcel API views — search, detail, spatial query."""
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Q, Count
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Parcel
from .serializers import ParcelSerializer, ParcelGeoSerializer


class ParcelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Search parcels by parcel_id, address, or spatial proximity.

    Examples:
      /api/parcels/?search=Federal+Drive
      /api/parcels/?search=6401303008
      /api/parcels/near/?lat=38.95&lon=-104.81&radius=500
    """
    queryset = (
        Parcel.objects
        .select_related("council_district")
        .annotate(record_count=Count("records"))
    )
    serializer_class = ParcelSerializer
    lookup_field = "parcel_id"
    filter_backends = [filters.SearchFilter]
    search_fields = ["parcel_id", "address", "zip_code"]

    @action(detail=False, methods=["get"])
    def near(self, request):
        """Return parcels within `radius` meters of a lat/lon point."""
        try:
            lat = float(request.query_params.get("lat"))
            lon = float(request.query_params.get("lon"))
            radius_m = float(request.query_params.get("radius", 500))
        except (TypeError, ValueError):
            return Response(
                {"error": "lat, lon, and radius (meters) required"},
                status=400
            )

        point = Point(lon, lat, srid=4326)
        nearby = (
            Parcel.objects
            .filter(centroid__distance_lte=(point, D(m=radius_m)))
            .select_related("council_district")
            .annotate(record_count=Count("records"))
        )
        return Response(ParcelSerializer(nearby, many=True).data)

    @action(detail=False, methods=["get"])
    def geo(self, request):
        """Return parcels as GeoJSON for map rendering."""
        qs = self.filter_queryset(self.get_queryset())[:200]
        return Response(ParcelGeoSerializer(qs, many=True).data)
