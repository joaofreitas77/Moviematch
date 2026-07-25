from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("movies", "0004_movie_trailer_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="movie",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="movies",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
