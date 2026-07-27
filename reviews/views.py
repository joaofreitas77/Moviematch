from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS

from core.viewsets import SoftDeleteModelViewSet
from movies.models import Movie
from .models import Review
from .serializers import ReviewSerializer


class ReviewObjectPermission(BasePermission):
    def has_object_permission(self, request, view, review):
        if request.method in SAFE_METHODS:
            return True
        if request.method == "DELETE":
            return review.user_id == request.user.id or request.user.is_staff
        return review.user_id == request.user.id


class ReviewViewSet(SoftDeleteModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, ReviewObjectPermission]

    def get_queryset(self):
        queryset = Review.objects.filter(
            is_deleted=False
        ).select_related("movie", "user").order_by("-created_at")

        movie_id = self.request.query_params.get("movie")
        if movie_id:
            visible_movies = Movie.objects.filter(is_deleted=False)
            if not self.request.user.is_staff:
                visible_movies = visible_movies.filter(
                    owner__isnull=True
                ) | visible_movies.filter(owner=self.request.user)
            movie = visible_movies.filter(pk=movie_id).first()
            if movie is None:
                return queryset.none()
            queryset = queryset.filter(
                movie__tittle__iexact=movie.tittle,
                movie__realese_year=movie.realese_year,
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
