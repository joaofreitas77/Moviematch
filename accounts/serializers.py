from django.contrib.auth.models import User
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        error_messages={"min_length": "A senha deve ter pelo menos 6 caracteres."},
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_username(self, username):
        username = username.strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso.")
        return username

    def validate_email(self, email):
        email = email.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return email

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )
        return user


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_active"]


class AdminUserSerializer(serializers.ModelSerializer):
    movies_count = serializers.IntegerField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    favorites_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "is_active", "is_staff",
            "date_joined", "last_login", "movies_count", "reviews_count",
            "favorites_count",
        ]


class SupportRequestSerializer(serializers.Serializer):
    CATEGORY_CHOICES = (
        ("technical", "Problema técnico"),
        ("suggestion", "Sugestão de melhoria"),
        ("account", "Conta e acesso"),
        ("catalog", "Filmes e catálogo"),
        ("other", "Outro assunto"),
    )

    category = serializers.ChoiceField(choices=CATEGORY_CHOICES)
    subject = serializers.CharField(min_length=5, max_length=120, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    message = serializers.CharField(min_length=20, max_length=3000, trim_whitespace=True)
