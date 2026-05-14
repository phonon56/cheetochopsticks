"""
Document models.

Documents (PDFs, images, etc.) are preserved as-uploaded. extracted_text
holds the searchable, machine-readable representation. This separation
honors the original record while enabling full-text search across the
corpus.
"""
from django.db import models
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex


class Document(models.Model):
    DOCUMENT_TYPES = [
        ("pdf", "PDF"),
        ("image", "Image"),
        ("doc", "Word Document"),
        ("xls", "Spreadsheet"),
        ("other", "Other"),
    ]

    record = models.ForeignKey(
        "records.Record", on_delete=models.CASCADE,
        related_name="documents"
    )
    file = models.FileField(upload_to="documents/%Y/%m/")
    filename = models.CharField(max_length=512)
    document_type = models.CharField(
        max_length=16, choices=DOCUMENT_TYPES, default="pdf"
    )
    extracted_text = models.TextField(blank=True)
    search_vector = SearchVectorField(null=True, blank=True)

    page_count = models.IntegerField(null=True, blank=True)
    byte_size = models.BigIntegerField(null=True, blank=True)

    source_url = models.URLField(blank=True, max_length=1024)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            GinIndex(fields=["search_vector"]),
        ]

    def __str__(self):
        return self.filename
