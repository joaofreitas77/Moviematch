from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from favorites.models import Favorite
from movies.models import Movie
from reviews.models import Review
from .serializers import AdminUserSerializer, CurrentUserSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            "users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "inactive_users": User.objects.filter(is_active=False).count(),
            "movies": Movie.objects.filter(is_deleted=False).count(),
            "user_movies": Movie.objects.filter(is_deleted=False, owner__isnull=False).count(),
            "reviews": Review.objects.filter(is_deleted=False).count(),
            "favorites": Favorite.objects.filter(is_deleted=False).count(),
        })


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        return User.objects.annotate(
            movies_count=Count("movies", distinct=True),
            reviews_count=Count("reviews", distinct=True),
            favorites_count=Count("favorites", distinct=True),
        ).order_by("-date_joined")


class AdminUserStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        user = generics.get_object_or_404(User, id=user_id)
        if user == request.user:
            return Response(
                {"error": "Você não pode desativar sua própria conta administrativa."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_active = request.data.get("is_active")
        if not isinstance(is_active, bool):
            return Response(
                {"error": "Informe is_active como true ou false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = is_active
        user.save(update_fields=["is_active"])
        return Response(CurrentUserSerializer(user).data)
