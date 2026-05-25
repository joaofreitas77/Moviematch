from django.db import models
from django.contrib.auth.models import User
from core.models import BaseModel
from movies.models import Movie

class Favorite(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='favorites')

    class Meta:
        unique_together = ('user', 'movie')

    def __str__(self):
        return f'{self.user.username} favoritou {self.movie.title}'