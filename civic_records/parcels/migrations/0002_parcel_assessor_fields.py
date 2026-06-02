from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("parcels", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="parcel",
            name="owner_name",
            field=models.CharField(blank=True, max_length=256),
        ),
        migrations.AddField(
            model_name="parcel",
            name="owner_mailing_address",
            field=models.CharField(blank=True, max_length=256),
        ),
        migrations.AddField(
            model_name="parcel",
            name="market_value",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name="parcel",
            name="assessed_value",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name="parcel",
            name="year_built",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="parcel",
            name="property_class",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name="parcel",
            name="last_assessed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
