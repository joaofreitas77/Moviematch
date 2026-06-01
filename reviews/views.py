from rest_framework.permissions import IsAuthenticated

from core.viewsets import SoftDeleteModelViewSet
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(SoftDeleteModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(
            is_deleted=False
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)