from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from core.viewsets import SoftDeleteModelViewSet
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(SoftDeleteModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Review.objects.filter(
            is_deleted=False
        )
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(movie__owner__isnull=True) | Q(movie__owner=self.request.user)
            )
        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
