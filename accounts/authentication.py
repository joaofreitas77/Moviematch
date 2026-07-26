from django.contrib.auth.models import update_last_login
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenObtainSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from core.throttles import LoginRateThrottle


class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    required_is_staff = False
    invalid_role_message = "Esta conta deve usar o acesso administrativo."

    def validate(self, attrs):
        # Primeiro autentica, depois valida o tipo de acesso. O token e o
        # last_login só são criados quando o fluxo de login está correto.
        data = TokenObtainSerializer.validate(self, attrs)

        if self.user.is_staff != self.required_is_staff:
            raise AuthenticationFailed(self.invalid_role_message)

        refresh = self.get_token(self.user)
        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)
        data["is_staff"] = self.user.is_staff
        update_last_login(None, self.user)
        return data


class UserTokenObtainPairSerializer(RoleTokenObtainPairSerializer):
    pass


class AdminTokenObtainPairSerializer(RoleTokenObtainPairSerializer):
    required_is_staff = True
    invalid_role_message = "Acesso permitido somente para administradores."


class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]


class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]
