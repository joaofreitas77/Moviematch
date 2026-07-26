from collections import defaultdict

from django.db.models import Avg, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from favorites.models import Favorite
from movies.models import Movie
from movies.serializers import MovieSerializer
from reviews.models import Review


def movie_genres(movie):
    return [genre.strip() for genre in (movie.genre or "").split(",") if genre.strip()]


class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        genre_scores = defaultdict(float)

        favorites = Favorite.objects.filter(
            user=user,
            is_deleted=False,
            movie__is_deleted=False,
        ).select_related("movie")
        reviews = Review.objects.filter(
            user=user,
            is_deleted=False,
            movie__is_deleted=False,
        ).select_related("movie")

        interacted_ids = set()
        for favorite in favorites:
            interacted_ids.add(favorite.movie_id)
            for genre in movie_genres(favorite.movie):
                genre_scores[genre] += 3

        for review in reviews:
            interacted_ids.add(review.movie_id)
            preference = review.rating - 3
            for genre in movie_genres(review.movie):
                genre_scores[genre] += preference * 2

        visible_movies = Movie.objects.filter(is_deleted=False).filter(
            Q(owner__isnull=True) | Q(owner=user)
        ).exclude(id__in=interacted_ids).annotate(
            community_rating=Avg("reviews__rating", filter=Q(reviews__is_deleted=False))
        )

        ranked = []
        for movie in visible_movies:
            genres = movie_genres(movie)
            affinity = sum(max(genre_scores.get(genre, 0), 0) for genre in genres)
            imdb_rating = float(movie.imdb_rating or 0) if movie.imdb_rating not in {None, "N/A"} else 0
            community_rating = float(movie.community_rating or 0)
            score = affinity * 10 + community_rating * 2 + imdb_rating

            matching_genres = sorted(
                (genre for genre in genres if genre_scores.get(genre, 0) > 0),
                key=lambda genre: genre_scores[genre],
                reverse=True,
            )
            ranked.append((score, movie, matching_genres[:2]))

        ranked.sort(key=lambda item: (item[0], item[1].created_at), reverse=True)
        selected = ranked[:20]
        serialized = MovieSerializer([item[1] for item in selected], many=True).data

        for data, (score, movie, matching_genres) in zip(serialized, selected):
            data["recommendation_score"] = round(score, 2)
            data["recommendation_reason"] = (
                f"Porque você gosta de {' e '.join(matching_genres)}"
                if matching_genres
                else "Popular entre os usuários"
            )

        favorite_genres = [
            genre for genre, score in sorted(genre_scores.items(), key=lambda item: item[1], reverse=True)
            if score > 0
        ][:5]

        return Response({
            "results": serialized,
            "favorite_genres": favorite_genres,
            "has_preferences": bool(genre_scores),
        })
