from rest_framework.routers import DefaultRouter
from .views import MovieViewSet
from django.urls import path
from .views import ImportMovieView

router = DefaultRouter()
router.register(r'', MovieViewSet, basename='movies')

urlpatterns = [
    path(
        "import/",
        ImportMovieView.as_view(),
        name="import-movie"
    ),
]

urlpatterns += router.urls