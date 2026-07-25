from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("movies", "0003_movie_actors_movie_awards_movie_country_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="movie",
            name="trailer_url",
            field=models.URLField(blank=True, null=True),
        ),
    ]
