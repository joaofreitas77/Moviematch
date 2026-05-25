from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'movie', 'rating', 'is_deleted')
    search_fields = ('user__username', 'movie__tittle')
    list_filter = ('rating', 'is_deleted')