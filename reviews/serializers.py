from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "username",
            "movie",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "created_at",
        ]

    def validate_movie(self, movie):
        user = self.context["request"].user
        if not user.is_staff and movie.owner_id not in {None, user.id}:
            raise serializers.ValidationError("Este filme não está disponível para sua conta.")
        return movie
