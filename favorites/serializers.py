from rest_framework import serializers
from .models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['id', 'movie', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_movie(self, movie):
        user = self.context["request"].user
        if not user.is_staff and movie.owner_id not in {None, user.id}:
            raise serializers.ValidationError("Este filme não está disponível para sua conta.")
        return movie
