"""Record API views."""
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Record
from .serializers import RecordListSerializer, RecordDetailSerializer


class RecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Record.objects.select_related("parcel").prefetch_related(
        "history", "connected_records"
    )
    lookup_field = "record_id"
    filter_backends = [
        filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter
    ]
    filterset_fields = ["record_type", "status", "owner_department",
                        "source_system", "parcel__parcel_id"]
    search_fields = ["record_id", "title", "description",
                     "plain_summary", "parcel__parcel_id",
                     "parcel__address"]
    ordering_fields = ["occurred_at", "updated_at", "created_at"]
    ordering = ["-updated_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return RecordDetailSerializer
        return RecordListSerializer
