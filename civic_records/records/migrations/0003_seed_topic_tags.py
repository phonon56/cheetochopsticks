"""
Seed the closed TopicTag taxonomy.

These ~20 tags are the *complete* allowed vocabulary for soft topic
classification. New tags require a code change + new data migration —
this discipline prevents tag drift ('Housing' / 'housing' / 'aff-housing').

Adjust the list below if a tag turns out to be missing or redundant once
real records start flowing through enrichment. Removing a tag is a
breaking change (existing M2M rows will be orphaned), so prefer to deprecate
rather than delete.
"""
from django.db import migrations


SEED_TAGS = [
    ("housing",            "Housing",
     "Affordable housing, residential development, housing programs."),
    ("transportation",     "Transportation",
     "Roads, transit, traffic, mobility, parking, paving."),
    ("public-safety",      "Public Safety",
     "Police, fire, EMS, emergency response, crime prevention."),
    ("infrastructure",     "Infrastructure",
     "Water, sewer, bridges, broadband, public works construction."),
    ("zoning",             "Zoning",
     "Zoning amendments, variances, conditional use, land use code."),
    ("stormwater",         "Stormwater",
     "Drainage, flood control, watershed, MS4 compliance, retention."),
    ("parks",              "Parks & Recreation",
     "Parks, trails, open space, recreation programs and facilities."),
    ("utilities",          "Utilities",
     "Electric, gas, water utility operations, rates, outages."),
    ("environment",        "Environment",
     "Air quality, conservation, climate, wildfire mitigation."),
    ("finance",            "Finance",
     "Budget, tax, mill levy, bond, special districts, fees."),
    ("planning",           "Planning",
     "Comprehensive plans, master plans, area plans, long-range planning."),
    ("development",        "Development",
     "Subdivision, plat, site plan, commercial/industrial projects."),
    ("enforcement",        "Code Enforcement",
     "Violations, complaints, abatement, nuisance abatement."),
    ("emergency",          "Emergency Management",
     "Disaster response, evacuation, hazard mitigation, EOC activations."),
    ("accessibility",      "Accessibility",
     "ADA, sidewalks, curb ramps, accessible facilities and programs."),
    ("equity",             "Equity & Inclusion",
     "Equitable access, civil rights, language access, demographic equity."),
    ("waste",              "Waste Management",
     "Trash, recycling, hazardous waste, landfill, composting."),
    ("broadband",          "Broadband & Digital",
     "Internet access, digital equity, fiber, telecom permits."),
    ("food",               "Food & Agriculture",
     "Food access, urban ag, food safety, restaurant inspections."),
    ("meeting",            "Meetings & Agendas",
     "Council, board, commission, advisory body meeting business."),
]


def seed(apps, schema_editor):
    TopicTag = apps.get_model("records", "TopicTag")
    for slug, label, description in SEED_TAGS:
        TopicTag.objects.update_or_create(
            slug=slug,
            defaults={"label": label, "description": description},
        )


def unseed(apps, schema_editor):
    # Reverse migration: remove only tags this migration seeded.
    # Existing M2M rows pointing at these tags will be cascaded away.
    TopicTag = apps.get_model("records", "TopicTag")
    slugs = [s for s, *_ in SEED_TAGS]
    TopicTag.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("records", "0002_topictag_record_enriched_at_record_last_synced_at_and_more"),
    ]

    operations = [
        migrations.RunPython(seed, reverse_code=unseed),
    ]
