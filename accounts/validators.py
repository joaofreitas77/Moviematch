import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class PasswordCompositionValidator:
    """Require letters plus at least one number or special character."""

    def validate(self, password, user=None):
        if not re.search(r"[A-Za-z]", password) or not re.search(r"[^A-Za-z]", password):
            raise ValidationError(
                _("A senha deve conter letras e pelo menos um número ou caractere especial."),
                code="password_missing_required_character",
            )

    def get_help_text(self):
        return _("Sua senha deve conter letras e pelo menos um número ou caractere especial.")
