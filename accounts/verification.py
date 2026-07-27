import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.utils.html import escape

from .email_services import send_verification_email
from .models import EmailVerification


def issue_verification_code(user):
    code = f"{secrets.randbelow(1_000_000):06d}"
    validity_minutes = settings.EMAIL_VERIFICATION_CODE_MINUTES
    EmailVerification.objects.update_or_create(
        user=user,
        defaults={
            "code_hash": make_password(code),
            "expires_at": timezone.now() + timedelta(minutes=validity_minutes),
            "attempts": 0,
            "sent_at": timezone.now(),
        },
    )
    safe_username = escape(user.username)
    text = (
        f"Olá, {user.username}!\n\nSeu código de confirmação do CineLog é: {code}\n"
        f"Ele expira em {validity_minutes} minutos. Se você não fez este cadastro, ignore esta mensagem."
    )
    html = f"""
    <!doctype html><html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#080808;color:#fff;font-family:Arial,sans-serif">
      <div style="max-width:560px;margin:auto;padding:32px;background:#111113;border:1px solid #29292e;border-radius:14px">
        <div style="font-size:22px;font-weight:800">CINE<span style="color:#e50914">LOG</span></div>
        <h1 style="margin:30px 0 10px;font-size:25px">Confirme seu e-mail</h1>
        <p style="color:#aaaab1;line-height:1.6">Olá, {safe_username}. Use o código abaixo para ativar sua conta:</p>
        <div style="margin:25px 0;padding:20px;text-align:center;background:#080808;border-radius:10px;color:#fff;font-size:34px;font-weight:800;letter-spacing:8px">{code}</div>
        <p style="color:#777780;font-size:12px">O código expira em {validity_minutes} minutos. Se você não fez este cadastro, ignore a mensagem.</p>
      </div>
    </body></html>
    """
    send_verification_email(user.email, "Seu código de confirmação do CineLog", text, html)
