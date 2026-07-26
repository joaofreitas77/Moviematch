from django.db.models import Q
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated, SAFE_METHODS
from .models import Movie
from .serializers import MovieSerializer
from .trailer_services import search_trailer
from rest_framework.views import APIView
from rest_framework.response import Response
from .omdb_services import search_movie
from rest_framework import viewsets
from .models import Movie
from .serializers import MovieSerializer

class IsMovieOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff or obj.owner_id == request.user.id


class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsMovieOwnerOrAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = Movie.objects.filter(is_deleted=False)

        if self.request.user.is_staff:
            pass
        elif self.request.user.is_authenticated:
            queryset = queryset.filter(Q(owner__isnull=True) | Q(owner=self.request.user))
        else:
            queryset = queryset.filter(owner__isnull=True)

        if self.request.query_params.get("mine") == "true":
            if not self.request.user.is_authenticated:
                return queryset.none()
            queryset = queryset.filter(owner=self.request.user)

        title = self.request.query_params.get('title')
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
            queryset = queryset.filter(realese_year=release_year)

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        movie = self.get_object()

        if not movie.trailer_url:
            trailer_url = search_trailer(movie.tittle, movie.realese_year)
            if trailer_url:
                movie.trailer_url = trailer_url
                movie.save(update_fields=["trailer_url", "updated_at"])

        serializer = self.get_serializer(movie)
        return Response(serializer.data)

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
        movie_title = data.get("Title")
        release_year = int(data.get("Year", "0")[:4])

        if Movie.objects.filter(
            owner__isnull=True,
            is_deleted=False,
            tittle__iexact=movie_title,
            realese_year=release_year,
        ).exists():
            return Response(
                {
                    "error": (
                        "Este filme já está disponível no catálogo padrão. "
                        "Adicione-o à Minha lista em vez de Meus filmes."
                    )
                },
                status=409,
            )

        defaults = {
                "description": data.get("Plot"),
                "type": "movie",
                "genre": data.get("Genre"),
                "realese_year": release_year,
                "poster": data.get("Poster") if data.get("Poster") != "N/A" else None,
                "runtime": data.get("Runtime") if data.get("Runtime") != "N/A" else None,
                "director": data.get("Director") if data.get("Director") != "N/A" else None,
                "writer": data.get("Writer") if data.get("Writer") != "N/A" else None,
                "actors": data.get("Actors") if data.get("Actors") != "N/A" else None,
                "language": data.get("Language") if data.get("Language") != "N/A" else None,
                "country": data.get("Country") if data.get("Country") != "N/A" else None,
                "awards": data.get("Awards") if data.get("Awards") != "N/A" else None,
                "imdb_rating": data.get("imdbRating") if data.get("imdbRating") != "N/A" else None,
                "imdb_votes": data.get("imdbVotes") if data.get("imdbVotes") != "N/A" else None,
                "metascore": data.get("Metascore") if data.get("Metascore") != "N/A" else None,
                "rated": data.get("Rated") if data.get("Rated") != "N/A" else None,
                "released": data.get("Released") if data.get("Released") != "N/A" else None,
                "trailer_url": search_trailer(
                    movie_title,
                    release_year,
                ),
        }

        movie = Movie.objects.filter(
            tittle__iexact=movie_title,
            realese_year=release_year,
            owner=request.user,
        ).first()
        restored = bool(movie and movie.is_deleted)

        if movie:
            if restored:
                for field, value in defaults.items():
                    setattr(movie, field, value)
                movie.is_deleted = False
                movie.save()
            created = restored
        else:
            movie = Movie.objects.create(
                tittle=movie_title,
                owner=request.user,
                **defaults,
            )
            created = True

        return Response({
            "created": created,
            "movie": movie.tittle,
            "id": movie.id,
            "restored": restored,
        })
