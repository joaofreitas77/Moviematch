from django.contrib.auth.models import User
from unittest.mock import patch

from rest_framework.test import APITestCase

from .models import Movie
from .omdb_services import OMDbServiceError


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

    def test_user_cannot_create_personal_copy_of_public_movie(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/v1/movies/",
            {
                "tittle": "public",
                "description": "Description",
                "type": "movie",
                "genre": "Drama",
                "realese_year": 2024,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Movie.objects.filter(owner=self.user, tittle__iexact="Public").count(), 0)

    def test_other_users_private_movie_does_not_block_personal_copy(self):
        movie_data("Only personal", self.other)
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/v1/movies/",
            {
                "tittle": "Only personal",
                "description": "Description",
                "type": "movie",
                "genre": "Drama",
                "realese_year": 2024,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Movie.objects.filter(owner=self.user, tittle="Only personal").exists())

    @patch("movies.views.search_trailer", return_value=None)
    @patch("movies.views.search_movie")
    def test_import_rejects_movie_from_public_catalog(self, search_movie_mock, _search_trailer_mock):
        search_movie_mock.return_value = {
            "Response": "True",
            "Title": "Public",
            "Year": "2024",
            "Plot": "Description",
            "Genre": "Drama",
        }
        self.client.force_authenticate(self.user)

        response = self.client.post(
            "/api/v1/movies/import/",
            {"title": "Public"},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertIn("catálogo padrão", response.data["error"])

    @patch("movies.views.search_movie", side_effect=OMDbServiceError)
    def test_import_handles_omdb_outage(self, _search_movie_mock):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            "/api/v1/movies/import/",
            {"title": "Any movie"},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn("temporariamente indisponível", response.data["error"])
