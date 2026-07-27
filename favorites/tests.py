from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from movies.models import Movie


class PersonalMovieFavoriteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("owner", password="123456")
        self.other = User.objects.create_user("other", password="123456")
        self.own_movie = Movie.objects.create(
            tittle="My Movie", description="Description", type="movie",
            genre="Drama", realese_year=2024, owner=self.user,
        )
        self.other_movie = Movie.objects.create(
            tittle="Other Movie", description="Description", type="movie",
            genre="Drama", realese_year=2024, owner=self.other,
        )
        self.client.force_authenticate(self.user)

    def test_user_can_favorite_own_personal_movie(self):
        response = self.client.post("/api/v1/favorites/", {"movie": self.own_movie.id}, format="json")
        self.assertEqual(response.status_code, 201)

    def test_user_cannot_favorite_another_users_personal_movie(self):
        response = self.client.post("/api/v1/favorites/", {"movie": self.other_movie.id}, format="json")
        self.assertEqual(response.status_code, 400)

# Create your tests here.
