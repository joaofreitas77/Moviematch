from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from accounts.authentication import AdminTokenObtainPairView, UserTokenObtainPairView
from core.views import health_check

urlpatterns = [
    path('api/v1/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),

    path('api/v1/token/', UserTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/admin/', AdminTokenObtainPairView.as_view(), name='admin_token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    path('api/v1/movies/', include('movies.urls')),
    path('api/v1/reviews/', include('reviews.urls')),
    path('api/v1/favorites/', include('favorites.urls')),
    path('api/v1/recomendations/', include('recomendations.urls')),
    path("api/v1/accounts/", include("accounts.urls")),
]
