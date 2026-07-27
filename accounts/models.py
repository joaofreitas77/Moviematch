from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    THEME_CHOICES = (
        ("dark", "Escuro"),
        ("light", "Claro"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar_data = models.TextField(blank=True, default="")
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default="dark")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"
