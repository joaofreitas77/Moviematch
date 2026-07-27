import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

def send_support_email(subject, text_body, html_body, reply_to):
    """Keep support on Resend, falling back to SMTP when no API key exists."""
    if settings.RESEND_API_KEY:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.RESEND_FROM_EMAIL,
                "to": [settings.SUPPORT_EMAIL],
                "reply_to": reply_to,
                "subject": subject,
                "text": text_body,
                "html": html_body,
            },
            timeout=10,
        )
        response.raise_for_status()
        return

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.SUPPORT_EMAIL],
        reply_to=[reply_to],
    )
    email.attach_alternative(html_body, "text/html")
    email.send(fail_silently=False)
