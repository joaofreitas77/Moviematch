from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.viewsets import SoftDeleteModelViewSet
from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteViewSet(SoftDeleteModelViewSet):
    queryset = Favorite.objects.none()
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(
            user=self.request.user,
            is_deleted=False
        )

    def create(self, request, *args, **kwargs):
        movie_id = request.data.get("movie")

        # Valida inclusive favoritos antigos que estejam sendo restaurados.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        favorite = Favorite.objects.filter(
            user=request.user,
            movie_id=movie_id
        ).first()

        if favorite:
            favorite.is_deleted = False
            favorite.save()

            serializer = self.get_serializer(favorite)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer.save(user=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
