"""Frontend views — server-rendered HTML, progressive enhancement on top."""
from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Q
from parcels.models import Parcel
from records.models import Record, TopicTag
from projects.models import Project


def _apply_filters(qs, request):
    """Apply tag/type/status filters from query string to a Record queryset."""
    tag_slugs = request.GET.getlist("tag")
    types     = request.GET.getlist("type")
    statuses  = request.GET.getlist("status")

    if tag_slugs:
        qs = qs.filter(topic_tags__slug__in=tag_slugs).distinct()
    if types:
        qs = qs.filter(record_type__in=types)
    if statuses:
        qs = qs.filter(status__in=statuses)
    return qs


def home(request):
    """Landing page with search, faceted filters, and a recent-activity feed."""
    q = request.GET.get("q", "").strip()

    # Build the base record queryset, with all filters applied.
    record_qs = (
        Record.objects.select_related("parcel")
        .prefetch_related("topic_tags")
    )
    if q:
        record_qs = record_qs.filter(
            Q(record_id__icontains=q)
            | Q(title__icontains=q)
            | Q(description__icontains=q)
            | Q(plain_summary__icontains=q)
        )
    record_qs = _apply_filters(record_qs, request)

    # Parcel results aren't tag-filtered (parcels don't carry tags directly,
    # though we could derive them via M2M-on-records later).
    parcel_results = []
    if q:
        parcel_results = (
            Parcel.objects.filter(
                Q(parcel_id__icontains=q)
                | Q(address__icontains=q)
                | Q(zip_code__icontains=q)
            )
            .annotate(n_records=Count("records"))
            .order_by("-n_records")[:25]
        )

    record_results = list(record_qs.order_by("-updated_at")[:50])

    # Tag chips: show all tags that have at least one record after the
    # current (non-tag) filters — so the count next to each chip reflects
    # what you'd actually see if you clicked it.
    base_for_facets = (
        Record.objects.all()
        if not q else
        Record.objects.filter(
            Q(record_id__icontains=q) | Q(title__icontains=q)
            | Q(description__icontains=q) | Q(plain_summary__icontains=q)
        )
    )
    facet_qs = _apply_filters(base_for_facets, request).filter(
        topic_tags__isnull=False
    )

    tag_facets = (
        TopicTag.objects.filter(records__in=facet_qs)
        .annotate(n=Count("records", distinct=True))
        .order_by("-n", "label")[:12]
    )

    active_tags    = set(request.GET.getlist("tag"))
    active_types   = set(request.GET.getlist("type"))
    active_status  = set(request.GET.getlist("status"))

    # Featured projects — admin-curated chip row above the search.
    # Annotate record_count so we can show how rich each one is at a glance.
    featured_projects = (
        Project.objects.filter(featured=True)
        .annotate(n_records=Count("records"))
        .order_by("-n_records", "-updated_at")[:6]
    )

    parcel_count = Parcel.objects.count()
    record_count = Record.objects.count()

    return render(request, "frontend/home.html", {
        "q": q,
        "parcel_results": parcel_results,
        "record_results": record_results,
        "tag_facets": tag_facets,
        "active_tags":   active_tags,
        "active_types":  active_types,
        "active_status": active_status,
        "has_filters":   bool(active_tags or active_types or active_status),
        "featured_projects": featured_projects,
        "parcel_count":  parcel_count,
        "record_count":  record_count,
    })


def parcel_detail(request, parcel_id):
    """Show all records attached to a single parcel."""
    parcel = get_object_or_404(
        Parcel.objects.select_related("council_district"),
        parcel_id=parcel_id,
    )
    records = (
        parcel.records
        .select_related("parcel")
        .prefetch_related("history", "documents")
        .order_by("-updated_at")
    )

    by_type = {}
    for r in records:
        by_type.setdefault(r.get_record_type_display(), []).append(r)

    return render(request, "frontend/parcel_detail.html", {
        "parcel": parcel,
        "records": records,
        "records_by_type": by_type,
    })


def record_detail(request, record_id):
    """Detail view for a single record."""
    record = get_object_or_404(
        Record.objects
        .select_related("parcel")
        .prefetch_related("history", "connected_records", "documents"),
        record_id=record_id,
    )
    return render(request, "frontend/record_detail.html", {
        "record": record,
    })


def project_detail(request, slug):
    """
    Lifecycle view for a single Project: header + map + chronological
    timeline of every Record linked to it + the M2M parcel list.
    """
    project = get_object_or_404(
        Project.objects.prefetch_related("topic_tags", "parcels"),
        slug=slug,
    )

    # Records FK'd to this Project, ordered for timeline display.
    # occurred_at can be null (e.g., a solicitation with no parsed date),
    # so order by occurred_at desc nulls-last, then updated_at desc.
    records = (
        project.records
        .select_related("parcel")
        .prefetch_related("topic_tags")
        .order_by("-occurred_at", "-updated_at")
    )

    # Group by record_type for the secondary "by type" summary
    by_type: dict[str, int] = {}
    for r in records:
        by_type[r.get_record_type_display()] = by_type.get(r.get_record_type_display(), 0) + 1

    return render(request, "frontend/project_detail.html", {
        "project": project,
        "records": records,
        "type_counts": sorted(by_type.items(), key=lambda kv: -kv[1]),
    })
