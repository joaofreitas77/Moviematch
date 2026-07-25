from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Movie


def movie_data(title, owner=None):
    return Movie.objects.create(
        tittle=title,
        description="Description",
        type="movie",
        genre="Drama",
        realese_year=2024,
        owner=owner,
    )


class MoviePrivacyTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("owner", password="test")
        self.other = User.objects.create_user("other", password="test")
        self.admin = User.objects.create_user("admin", password="test", is_staff=True)
        self.public_movie = movie_data("Public")
        self.private_movie = movie_data("Private", self.user)

    def test_private_movie_is_visible_only_to_owner_and_admin(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(f"/api/v1/movies/{self.private_movie.id}/").status_code, 404)

        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(f"/api/v1/movies/{self.private_movie.id}/").status_code, 200)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(f"/api/v1/movies/{self.private_movie.id}/").status_code, 200)

    def test_user_cannot_delete_public_movie(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(f"/api/v1/movies/{self.public_movie.id}/")
        self.assertEqual(response.status_code, 403)
