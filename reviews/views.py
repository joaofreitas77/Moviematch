from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS

from core.viewsets import SoftDeleteModelViewSet
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
        return Review.objects.filter(
            is_deleted=False
        ).select_related("movie", "user").order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
