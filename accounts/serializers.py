import base64
import binascii
import re

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        error_messages={"invalid": "Informe um endereço de e-mail válido."},
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={"min_length": "A senha deve ter pelo menos 8 caracteres."},
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

    def validate_password(self, password):
        candidate = User(username=self.initial_data.get("username", ""), email=self.initial_data.get("email", ""))
        try:
            validate_password(password, user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return password

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user
class CurrentUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    theme = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_active", "avatar", "theme"]

    def _profile(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    def get_avatar(self, user):
        return self._profile(user).avatar_data or None

    def get_theme(self, user):
        return self._profile(user).theme


class ProfileUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    current_password = serializers.CharField(required=False, write_only=True)
    new_password = serializers.CharField(required=False, write_only=True, min_length=8)
    avatar = serializers.CharField(required=False, allow_blank=True)
    theme = serializers.ChoiceField(required=False, choices=UserProfile.THEME_CHOICES)

    def validate_email(self, email):
        user = self.context["request"].user
        email = email.strip().lower()
        if User.objects.exclude(pk=user.pk).filter(email__iexact=email).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return email

    def validate_avatar(self, avatar):
        if not avatar:
            return ""
        match = re.fullmatch(r"data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)", avatar)
        if not match:
            raise serializers.ValidationError("Use uma imagem JPG, PNG ou WebP.")
        try:
            image_bytes = base64.b64decode(match.group(2), validate=True)
        except (ValueError, binascii.Error):
            raise serializers.ValidationError("A imagem enviada é inválida.")
        if len(image_bytes) > 500 * 1024:
            raise serializers.ValidationError("A foto processada deve ter no máximo 500 KB.")
        return avatar

    def validate_new_password(self, password):
        try:
            validate_password(password, user=self.context["request"].user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return password

    def validate(self, attrs):
        user = self.context["request"].user
        sensitive_change = "email" in attrs or "new_password" in attrs
        if sensitive_change and not attrs.get("current_password"):
            raise serializers.ValidationError({"current_password": "Informe sua senha atual."})
        if sensitive_change and not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "A senha atual está incorreta."})
        return attrs

    def update(self, user, validated_data):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if "email" in validated_data:
            user.email = validated_data["email"]
        if validated_data.get("new_password"):
            user.set_password(validated_data["new_password"])
        if "email" in validated_data or validated_data.get("new_password"):
            user.save()
        if "avatar" in validated_data:
            profile.avatar_data = validated_data["avatar"]
        if "theme" in validated_data:
            profile.theme = validated_data["theme"]
        profile.save()
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    movies_count = serializers.IntegerField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    favorites_count = serializers.IntegerField(read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "is_active", "is_staff",
            "date_joined", "last_login", "movies_count", "reviews_count",
            "favorites_count", "avatar",
        ]

    def get_avatar(self, user):
        try:
            return user.profile.avatar_data or None
        except UserProfile.DoesNotExist:
            return None


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
