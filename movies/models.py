from django.db import models
from core.models import BaseModel

class Movie(BaseModel):
    TYPE_CHOICES = (
        ('movie', 'Filme'),
        ('series', 'Série'),
    )

    tittle = models.CharField(max_length=150)
    description = models.TextField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    genre = models.CharField(max_length=100)
    realese_year = models.IntegerField()
    poster = models.URLField(blank=True, null=True)
    runtime = models.CharField(max_length=50, blank=True, null=True)
    director = models.CharField(max_length=255, blank=True, null=True)
    writer = models.CharField(max_length=255, blank=True, null=True)
    actors = models.TextField(blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    awards = models.TextField(blank=True, null=True)
    imdb_rating = models.CharField(max_length=20, blank=True, null=True)
    imdb_votes = models.CharField(max_length=50, blank=True, null=True)
    metascore = models.CharField(max_length=20, blank=True, null=True)
    rated = models.CharField(max_length=50, blank=True, null=True)
    released = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.tittle