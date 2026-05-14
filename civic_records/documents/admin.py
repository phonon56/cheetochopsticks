from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("filename", "document_type", "record",
                    "page_count", "uploaded_at")
    list_filter = ("document_type",)
    search_fields = ("filename", "extracted_text",
                     "record__record_id", "record__title")
    raw_id_fields = ("record",)
    readonly_fields = ("uploaded_at", "search_vector")
