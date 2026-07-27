from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


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


class EmailVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_verification")
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    sent_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Verificação de {self.user.email}"
