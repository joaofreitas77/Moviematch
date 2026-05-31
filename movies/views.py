from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.permissions import IsAuthenticated
from core.viewsets import SoftDeleteModelViewSet
from .models import Movie
from .serializers import MovieSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from .omdb_services import search_movie


class MovieViewSet(SoftDeleteModelViewSet):
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Movie.objects.filter(is_deleted=False)

        title = self.request.query_params.get('tittle')
        genre = self.request.query_params.get('genre')
        movie_type = self.request.query_params.get('type')
        release_year = self.request.query_params.get('release_year')

        if title:
            queryset = queryset.filter(tittle__icontains=title)

        if genre:
            queryset = queryset.filter(genre__icontains=genre)

        if movie_type:
            queryset = queryset.filter(type=movie_type)

        if release_year:
            queryset = queryset.filter(release_year=release_year)

        return queryset

    @method_decorator(cache_page(60))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
class ImportMovieView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get("title")

        if not title:
            return Response(
                {"error": "Informe o título"},
                status=400
            )

        data = search_movie(title)

        if data.get("Response") == "False":
            return Response(
                {
                    "error": "Filme não encontrado",
                    "omdb_error": data.get("Error"),
                    "omdb_response": data
                },
                status=404
            )

        movie, created = Movie.objects.get_or_create(
            tittle=data.get("Title"),
            defaults={
                "description": data.get("Plot"),
                "type": "movie",
                "genre": data.get("Genre"),
                "realese_year": int(data.get("Year", "0")[:4]),
                "poster": data.get("Poster") if data.get("Poster") != "N/A" else None,
            }
        )

        return Response({
            "created": created,
            "movie": movie.tittle
        })