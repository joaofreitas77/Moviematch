from rest_framework import serializers
from movies.models import Movie
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    movie_title = serializers.CharField(source="movie.tittle", read_only=True)
    movie_poster = serializers.URLField(source="movie.poster", read_only=True)
    movie_year = serializers.IntegerField(source="movie.realese_year", read_only=True)
    movie_genre = serializers.CharField(source="movie.genre", read_only=True)
    movie_is_private = serializers.SerializerMethodField()
    can_access_movie = serializers.SerializerMethodField()
    accessible_movie_id = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "username",
            "movie",
            "movie_title",
            "movie_poster",
            "movie_year",
            "movie_genre",
            "movie_is_private",
            "can_access_movie",
            "accessible_movie_id",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "created_at",
        ]

    def get_movie_is_private(self, review):
        return review.movie.owner_id is not None

    def get_can_access_movie(self, review):
        return self._get_accessible_movie_id(review) is not None

    def get_accessible_movie_id(self, review):
        return self._get_accessible_movie_id(review)

    def _get_accessible_movie_id(self, review):
        user = self.context["request"].user
        cache = self.context.setdefault("accessible_movie_ids", {})
        if review.id in cache:
            return cache[review.id]

        if user.is_staff or review.movie.owner_id in {None, user.id}:
            accessible_id = review.movie_id
        else:
            accessible_id = Movie.objects.filter(
                owner=user,
                is_deleted=False,
                tittle__iexact=review.movie.tittle,
                realese_year=review.movie.realese_year,
            ).values_list("id", flat=True).first()

        cache[review.id] = accessible_id
        return accessible_id

    def validate_movie(self, movie):
        user = self.context["request"].user
        if not user.is_staff and movie.owner_id not in {None, user.id}:
            raise serializers.ValidationError("Este filme não está disponível para sua conta.")
        return movie

    def validate_rating(self, rating):
        if rating < 1 or rating > 5:
            raise serializers.ValidationError("A nota deve estar entre 1 e 5.")
        return rating
