from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class AdminAccountsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin", password="test", is_staff=True)
        self.user = User.objects.create_user("member", email="member@example.com", password="test")

    def test_regular_user_cannot_access_admin_data(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/v1/accounts/admin/users/")
        self.assertEqual(response.status_code, 403)

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
