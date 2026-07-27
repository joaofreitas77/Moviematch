from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from django.db.models import Count
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from django.utils.html import escape
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiTypes, extend_schema, inline_serializer
from rest_framework import serializers

from favorites.models import Favorite
from movies.models import Movie
from reviews.models import Review
from core.throttles import SupportRateThrottle
from .email_services import send_support_email
from .models import EmailVerification
from .verification import issue_verification_code
from .serializers import (
    AdminUserSerializer,
    CurrentUserSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    SupportRequestSerializer,
    VerifyEmailSerializer,
)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        try:
            issue_verification_code(user)
        except Exception:
            user.delete()
            return Response(
                {"error": "Não foi possível enviar o código de confirmação. Verifique o e-mail e tente novamente."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"email": user.email, "requires_verification": True, "message": "Código de confirmação enviado."},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        code = serializer.validated_data["code"]
        user = User.objects.filter(email__iexact=email, is_staff=False).first()
        if not user or user.is_active:
            if user and user.is_active:
                return Response({"message": "Este e-mail já foi confirmado."})
            return Response({"email": "Não existe um cadastro pendente para este e-mail."}, status=400)
        verification = EmailVerification.objects.select_for_update().filter(user=user).first()
        if not verification:
            return Response({"code": "Solicite um novo código de confirmação."}, status=400)
        if verification.expires_at <= timezone.now():
            return Response({"code": "Este código expirou. Solicite um novo."}, status=400)
        if verification.attempts >= 5:
            return Response({"code": "Limite de tentativas atingido. Solicite um novo código."}, status=400)
        if not check_password(code, verification.code_hash):
            verification.attempts += 1
            verification.save(update_fields=["attempts"])
            return Response({"code": "Código incorreto."}, status=400)
        user.is_active = True
        user.save(update_fields=["is_active"])
        verification.delete()
        return Response({"message": "E-mail confirmado. Sua conta está ativa."})


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email, is_active=False, is_staff=False).first()
        if not user:
            return Response({"email": "Não existe um cadastro pendente para este e-mail."}, status=400)
        verification = EmailVerification.objects.filter(user=user).first()
        if verification:
            elapsed = (timezone.now() - verification.sent_at).total_seconds()
            if elapsed < settings.EMAIL_VERIFICATION_RESEND_SECONDS:
                remaining = int(settings.EMAIL_VERIFICATION_RESEND_SECONDS - elapsed) + 1
                return Response({"error": f"Aguarde {remaining} segundos para reenviar."}, status=429)
        try:
            issue_verification_code(user)
        except Exception:
            return Response({"error": "Não foi possível enviar um novo código agora."}, status=503)
        return Response({"message": "Novo código enviado."})


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            instance=request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(CurrentUserSerializer(user).data)


class SupportRequestView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [SupportRateThrottle]

    @extend_schema(
        request=SupportRequestSerializer,
        responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 503: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        serializer = SupportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        category = dict(SupportRequestSerializer.CATEGORY_CHOICES)[data["category"]]

        sent_at = timezone.localtime().strftime("%d/%m/%Y às %H:%M")
        registered_email = request.user.email or "Não informado"
        body = (
            "Nova solicitação de suporte pelo CineLog\n\n"
            f"Categoria: {category}\n"
            f"Assunto: {data['subject']}\n"
            f"Usuário: {request.user.username} (ID {request.user.id})\n"
            f"E-mail cadastrado: {registered_email}\n"
            f"E-mail para retorno: {data['email']}\n\n"
            f"Enviado em: {sent_at}\n\n"
            "Mensagem:\n"
            f"{data['message']}"
        )
        html_message = f"""
        <!doctype html>
        <html lang="pt-BR">
          <body style="margin:0;padding:0;background:#080808;color:#f7f7f8;font-family:Arial,sans-serif">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080808;padding:32px 16px">
              <tr><td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#111113;border:1px solid #29292e;border-radius:14px;overflow:hidden">
                  <tr>
                    <td style="padding:24px 28px;background:#050505;border-bottom:3px solid #e50914">
                      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                        <td>
                          <div style="font-size:23px;font-weight:800;letter-spacing:-1px;color:#ffffff">CINE<span style="color:#e50914">LOG</span></div>
                          <div style="margin-top:3px;color:#85858d;font-size:11px;letter-spacing:1.2px">SUPORTE E CONTATO</div>
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                  <tr><td style="padding:30px 28px">
                    <div style="color:#ff2632;font-size:11px;font-weight:700;letter-spacing:1.5px">NOVA SOLICITAÇÃO</div>
                    <h1 style="margin:8px 0 8px;color:#ffffff;font-size:25px">{escape(data['subject'])}</h1>
                    <p style="margin:0 0 26px;color:#96969d;font-size:13px">Recebida pelo formulário oficial do CineLog em {sent_at}.</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#19191d;border-radius:9px;padding:18px">
                      <tr><td style="padding:5px;color:#777780;font-size:12px;width:145px">Categoria</td><td style="padding:5px;color:#ffffff;font-size:13px;font-weight:700">{escape(category)}</td></tr>
                      <tr><td style="padding:5px;color:#777780;font-size:12px">Usuário</td><td style="padding:5px;color:#ffffff;font-size:13px">{escape(request.user.username)} (ID {request.user.id})</td></tr>
                      <tr><td style="padding:5px;color:#777780;font-size:12px">E-mail cadastrado</td><td style="padding:5px;color:#ffffff;font-size:13px">{escape(registered_email)}</td></tr>
                      <tr><td style="padding:5px;color:#777780;font-size:12px">E-mail para retorno</td><td style="padding:5px;color:#ffffff;font-size:13px">{escape(data['email'])}</td></tr>
                    </table>

                    <div style="margin-top:24px;color:#777780;font-size:11px;font-weight:700;letter-spacing:1px">MENSAGEM</div>
                    <div style="margin-top:8px;padding:18px;color:#d1d1d5;background:#0b0b0d;border-left:3px solid #e50914;border-radius:6px;font-size:14px;line-height:1.65">{escape(data['message']).replace(chr(10), '<br>')}</div>

                    <p style="margin:24px 0 0;color:#777780;font-size:11px;line-height:1.5">Para responder ao usuário, basta usar a função Responder deste e-mail. O endereço de retorno já foi configurado automaticamente.</p>
                  </td></tr>
                  <tr><td style="padding:16px 28px;color:#5f5f66;background:#0b0b0d;font-size:10px;text-align:center">Mensagem enviada pelo sistema CineLog</td></tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>
        """
        try:
            send_support_email(
                subject=f"[CineLog - {category}] {data['subject']}",
                text_body=body,
                html_body=html_message,
                reply_to=data["email"],
            )
        except Exception:
            return Response(
                {"error": "Não foi possível enviar sua mensagem agora. Tente novamente mais tarde."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"message": "Mensagem enviada. Nossa equipe responderá pelo e-mail informado."},
            status=status.HTTP_201_CREATED,
        )


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        return Response({
            "users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "inactive_users": User.objects.filter(is_active=False).count(),
            "movies": Movie.objects.filter(is_deleted=False).count(),
            "user_movies": Movie.objects.filter(is_deleted=False, owner__isnull=False).count(),
            "reviews": Review.objects.filter(is_deleted=False).count(),
            "favorites": Favorite.objects.filter(is_deleted=False).count(),
        })


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        return User.objects.select_related("profile").annotate(
            movies_count=Count("movies", distinct=True),
            reviews_count=Count("reviews", distinct=True),
            favorites_count=Count("favorites", distinct=True),
        ).order_by("-date_joined")


class AdminUserStatusView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        request=inline_serializer(
            name="AdminUserStatusRequest",
            fields={"is_active": serializers.BooleanField()},
        ),
        responses={200: CurrentUserSerializer, 400: OpenApiTypes.OBJECT},
    )
    def patch(self, request, user_id):
        user = generics.get_object_or_404(User, id=user_id)
        if user == request.user:
            return Response(
                {"error": "Você não pode desativar sua própria conta administrativa."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_active = request.data.get("is_active")
        if not isinstance(is_active, bool):
            return Response(
                {"error": "Informe is_active como true ou false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = is_active
        user.save(update_fields=["is_active"])
        return Response(CurrentUserSerializer(user).data)
