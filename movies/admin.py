from django.contrib import admin
from .models import Movie

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('id', 'tittle', 'genre', 'realese_year', 'is_deleted')
    search_fields = ('tittle', 'genre')
    list_filter = ('type', 'genre', 'is_deleted')