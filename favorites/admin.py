from django.contrib import admin
from .models import Favorite

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'movie', 'is_deleted')
    search_fields = ('user__username', 'movie__tittle')
    list_filter = ('is_deleted',)