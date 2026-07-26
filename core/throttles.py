from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class MovieImportRateThrottle(UserRateThrottle):
    scope = "movie_import"


class SupportRateThrottle(UserRateThrottle):
    scope = "support"
