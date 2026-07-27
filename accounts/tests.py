import base64

from django.contrib.auth.models import User
from django.core import mail
from django.test import override_settings
from unittest.mock import patch
from rest_framework.test import APITestCase

from .models import UserProfile


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class RegisterTests(APITestCase):
    def test_rejects_duplicate_username_ignoring_case(self):
        User.objects.create_user("ExistingUser", email="first@example.com", password="123456")
        response = self.client.post(
            "/api/v1/accounts/register/",
            {"username": "existinguser", "email": "other@example.com", "password": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)

    def test_rejects_duplicate_email_ignoring_case(self):
        User.objects.create_user("first", email="Member@Example.com", password="123456")
        response = self.client.post(
            "/api/v1/accounts/register/",
            {"username": "second", "email": "member@example.com", "password": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_requires_at_least_eight_password_characters(self):
        response = self.client.post(
            "/api/v1/accounts/register/",
            {"username": "new-user", "email": "new@example.com", "password": "12345"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_rejects_common_or_single_type_passwords(self):
        for password in ("password", "12345678", "abcdefgh"):
            response = self.client.post(
                "/api/v1/accounts/register/",
                {"username": f"user-{password}", "email": f"{password}@example.com", "password": password},
                format="json",
            )
            self.assertEqual(response.status_code, 400, password)
            self.assertIn("password", response.data)

    def test_accepts_complex_password(self):
        with patch("accounts.verification.secrets.randbelow", return_value=123456):
            response = self.client.post(
                "/api/v1/accounts/register/",
                {"username": "secure-user", "email": "secure@example.com", "password": "Cinema#2026"},
                format="json",
            )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="secure-user")
        self.assertFalse(user.is_active)
        self.assertIn("123456", mail.outbox[-1].body)

        response = self.client.post(
            "/api/v1/accounts/verify-email/",
            {"email": "secure@example.com", "code": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_rejects_wrong_verification_code(self):
        with patch("accounts.verification.secrets.randbelow", return_value=123456):
            self.client.post(
                "/api/v1/accounts/register/",
                {"username": "pending-user", "email": "pending@example.com", "password": "Cinema#2026"},
                format="json",
            )
        response = self.client.post(
            "/api/v1/accounts/verify-email/",
            {"email": "pending@example.com", "code": "654321"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.get(username="pending-user").is_active)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("member", email="member@example.com", password="123456")
        self.other = User.objects.create_user("other", email="other@example.com", password="123456")
        self.client.force_authenticate(self.user)

    def test_user_can_update_theme_and_avatar(self):
        avatar = "data:image/png;base64,iVBORw0KGgo="
        response = self.client.patch(
            "/api/v1/accounts/profile/",
            {"theme": "light", "avatar": avatar},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["theme"], "light")
        self.assertEqual(response.data["avatar"], avatar)

    def test_email_change_requires_current_password_and_unique_email(self):
        response = self.client.patch(
            "/api/v1/accounts/profile/",
            {"email": "new@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("current_password", response.data)

        response = self.client.patch(
            "/api/v1/accounts/profile/",
            {"email": "OTHER@example.com", "current_password": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_user_can_change_password(self):
        response = self.client.patch(
            "/api/v1/accounts/profile/",
            {"current_password": "123456", "new_password": "Cinema#2026"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Cinema#2026"))

    def test_rejects_avatar_larger_than_server_limit(self):
        oversized_avatar = "data:image/jpeg;base64," + base64.b64encode(b"x" * (500 * 1024 + 1)).decode()
        response = self.client.patch(
            "/api/v1/accounts/profile/",
            {"avatar": oversized_avatar},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("avatar", response.data)


class AdminAccountsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin", password="test", is_staff=True)
        self.user = User.objects.create_user("member", email="member@example.com", password="test")

    def test_regular_user_cannot_access_admin_data(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/v1/accounts/admin/users/")
        self.assertEqual(response.status_code, 403)

    def test_admin_user_list_includes_profile_avatar(self):
        avatar = "data:image/png;base64,iVBORw0KGgo="
        UserProfile.objects.create(user=self.admin, avatar_data=avatar)
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/accounts/admin/users/")
        admin_data = next(user for user in response.data if user["id"] == self.admin.id)
        self.assertEqual(admin_data["avatar"], avatar)

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
    RESEND_API_KEY="",
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
