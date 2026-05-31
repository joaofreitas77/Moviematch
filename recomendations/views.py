from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg

from movies.models import Movie


class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        movies = Movie.objects.filter(
            is_deleted=False,
            reviews__is_deleted=False
        ).annotate(
            average_rating=Avg('reviews__rating')
        ).filter(
            average_rating__gte=4
        ).order_by('-average_rating')

        data = []

        for movie in movies:
            data.append({
                'id': movie.id,
                'tittle': movie.tittle,
                'type': movie.type,
                'genre': movie.genre,
                'release_year': movie.release_year,
                'average_rating': round(movie.average_rating, 2)
            })

        return Response(data)