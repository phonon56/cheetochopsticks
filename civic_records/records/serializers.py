"""Record API serializers."""
from rest_framework import serializers
from .models import Record, RecordHistory


class RecordHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RecordHistory
        fields = ["from_status", "to_status", "changed_at",
                  "changed_by", "note"]


class RecordListSerializer(serializers.ModelSerializer):
    record_type_label = serializers.CharField(
        source="get_record_type_display", read_only=True
    )
    status_label = serializers.CharField(
        source="get_status_display", read_only=True
    )
    parcel_id = serializers.CharField(source="parcel.parcel_id",
                                       read_only=True)

    class Meta:
        model = Record
        fields = [
            "record_id", "record_type", "record_type_label",
            "title", "status", "status_label",
            "owner_department", "parcel_id",
            "occurred_at", "updated_at",
        ]


class RecordDetailSerializer(serializers.ModelSerializer):
    record_type_label = serializers.CharField(
        source="get_record_type_display", read_only=True
    )
    status_label = serializers.CharField(
        source="get_status_display", read_only=True
    )
    parcel_id = serializers.CharField(source="parcel.parcel_id",
                                       read_only=True)
    history = RecordHistorySerializer(many=True, read_only=True)
    connected_records = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="record_id"
    )

    class Meta:
        model = Record
        fields = [
            "record_id", "record_type", "record_type_label",
            "title", "description",
            "status", "status_label",
            "owner_department", "owner_person",
            "source_system", "source_url",
            "plain_summary", "parcel_id",
            "history", "connected_records",
            "occurred_at", "created_at", "updated_at",
        ]
