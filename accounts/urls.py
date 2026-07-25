from django.urls import path
from .views import (
    AdminStatsView,
    AdminUserListView,
    AdminUserStatusView,
    CurrentUserView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:user_id>/status/", AdminUserStatusView.as_view(), name="admin-user-status"),
]
