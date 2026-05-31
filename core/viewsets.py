from rest_framework.viewsets import ModelViewSet


class SoftDeleteModelViewSet(ModelViewSet):
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()