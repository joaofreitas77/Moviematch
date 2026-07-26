from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from movies.models import Movie
from .models import Review


class ReviewPermissionTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user("author", password="test")
        self.other = User.objects.create_user("other", password="test")
        self.admin = User.objects.create_user("admin", password="test", is_staff=True)
        self.movie = Movie.objects.create(
            tittle="Movie", description="Description", type="movie",
            genre="Drama", realese_year=2024,
        )
        self.review = Review.objects.create(user=self.author, movie=self.movie, rating=4, comment="Good")

    def test_only_author_can_edit_review(self):
        self.client.force_authenticate(self.other)
        response = self.client.patch(f"/api/v1/reviews/{self.review.id}/", {"rating": 2}, format="json")
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.admin)
        response = self.client.patch(f"/api/v1/reviews/{self.review.id}/", {"rating": 2}, format="json")
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.author)
        response = self.client.patch(f"/api/v1/reviews/{self.review.id}/", {"rating": 5}, format="json")
        self.assertEqual(response.status_code, 200)

    def test_author_and_admin_can_delete_review(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.delete(f"/api/v1/reviews/{self.review.id}/").status_code, 403)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"/api/v1/reviews/{self.review.id}/").status_code, 204)

    def test_private_movie_review_is_public_but_movie_stays_private(self):
        private_movie = Movie.objects.create(
            tittle="Private Movie", description="Private description", type="movie",
            genre="Thriller", realese_year=2025, owner=self.author,
        )
        private_review = Review.objects.create(
            user=self.author, movie=private_movie, rating=5, comment="Excellent",
        )

        self.client.force_authenticate(self.other)
        reviews_response = self.client.get("/api/v1/reviews/")
        review_data = next(item for item in reviews_response.data["results"] if item["id"] == private_review.id)
        self.assertEqual(review_data["movie_title"], "Private Movie")
        self.assertFalse(review_data["can_access_movie"])
        self.assertIsNone(review_data["accessible_movie_id"])
        self.assertEqual(self.client.get(f"/api/v1/movies/{private_movie.id}/").status_code, 404)

        own_copy = Movie.objects.create(
            tittle="Private Movie", description="My copy", type="movie",
            genre="Thriller", realese_year=2025, owner=self.other,
        )
        reviews_response = self.client.get("/api/v1/reviews/")
        review_data = next(item for item in reviews_response.data["results"] if item["id"] == private_review.id)
        self.assertTrue(review_data["can_access_movie"])
        self.assertEqual(review_data["accessible_movie_id"], own_copy.id)
        self.assertEqual(self.client.get(f"/api/v1/movies/{own_copy.id}/").status_code, 200)
        self.assertEqual(self.client.get(f"/api/v1/movies/{private_movie.id}/").status_code, 404)
