from django.contrib.auth.models import User
from django.core import mail
from django.test import override_settings
from unittest.mock import patch
from rest_framework.test import APITestCase


class AdminAccountsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin", password="test", is_staff=True)
        self.user = User.objects.create_user("member", email="member@example.com", password="test")

    def test_regular_user_cannot_access_admin_data(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/v1/accounts/admin/users/")
        self.assertEqual(response.status_code, 403)

    def test_admin_cannot_use_regular_login(self):
        response = self.client.post(
            "/api/v1/token/",
            {"username": "admin", "password": "test"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertNotIn("access", response.data)
        self.admin.refresh_from_db()
        self.assertIsNone(self.admin.last_login)

    def test_regular_user_cannot_use_admin_login(self):
        response = self.client.post(
            "/api/v1/token/admin/",
            {"username": "member", "password": "test"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertNotIn("access", response.data)

    def test_admin_can_use_admin_login(self):
        response = self.client.post(
            "/api/v1/token/admin/",
            {"username": "admin", "password": "test"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_staff"])
        self.admin.refresh_from_db()
        self.assertIsNotNone(self.admin.last_login)

    def test_regular_login_updates_last_access(self):
        response = self.client.post(
            "/api/v1/token/",
            {"username": "member", "password": "test"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_login)

    def test_admin_can_deactivate_user_but_not_self(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f"/api/v1/accounts/admin/users/{self.user.id}/status/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

        response = self.client.patch(
            f"/api/v1/accounts/admin/users/{self.admin.id}/status/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    SUPPORT_EMAIL="jpgf.profissional@gmail.com",
)
class SupportRequestTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("member", password="test")
        self.client.force_authenticate(self.user)

    def test_valid_support_request_sends_email_to_admin(self):
        response = self.client.post(
            "/api/v1/accounts/support/",
            {
                "category": "suggestion",
                "subject": "Melhorar os filtros",
                "email": "member@example.com",
                "message": "Gostaria de sugerir novos filtros para o catálogo.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["jpgf.profissional@gmail.com"])
        self.assertEqual(mail.outbox[0].reply_to, ["member@example.com"])
        self.assertIn("CINE<span", mail.outbox[0].alternatives[0].content)
        self.assertIn(">LOG</span>", mail.outbox[0].alternatives[0].content)
        self.assertIn("member (ID", mail.outbox[0].body)
        self.assertNotIn("cid:cinelog-logo", mail.outbox[0].alternatives[0].content)

    def test_invalid_return_email_is_rejected(self):
        response = self.client.post(
            "/api/v1/accounts/support/",
            {
                "category": "technical",
                "subject": "Erro ao abrir filme",
                "email": "email-invalido",
                "message": "A tela de detalhes não abriu para este filme.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        RESEND_API_KEY="re_test",
        RESEND_FROM_EMAIL="CineLog <onboarding@resend.dev>",
    )
    @patch("accounts.email_services.requests.post")
    def test_production_support_uses_resend_https_api(self, post_mock):
        response = self.client.post(
            "/api/v1/accounts/support/",
            {
                "category": "technical",
                "subject": "Problema no catálogo",
                "email": "member@example.com",
                "message": "Não consegui abrir os detalhes de um filme.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 0)
        payload = post_mock.call_args.kwargs["json"]
        self.assertEqual(payload["to"], ["jpgf.profissional@gmail.com"])
        self.assertEqual(payload["reply_to"], "member@example.com")
        self.assertIn("CINE<span", payload["html"])
