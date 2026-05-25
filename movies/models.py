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

    def __str__(self):
        return self.tittle