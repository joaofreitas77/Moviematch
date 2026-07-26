from rest_framework import serializers
from .models import Movie

class MovieSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        request = self.context.get('request')
        title = attrs.get('tittle', getattr(self.instance, 'tittle', None))
        release_year = attrs.get(
            'realese_year',
            getattr(self.instance, 'realese_year', None),
        )

        # Filmes sem owner formam o catálogo padrão. Um usuário pode ter a
        # mesma obra que outro usuário, mas não deve duplicar uma obra pública.
        is_personal_movie = (
            self.instance.owner_id is not None
            if self.instance
            else request is not None and request.user.is_authenticated
        )
        if is_personal_movie and title and release_year:
            public_match = Movie.objects.filter(
                owner__isnull=True,
                is_deleted=False,
                tittle__iexact=title.strip(),
                realese_year=release_year,
            )
            if self.instance:
                public_match = public_match.exclude(pk=self.instance.pk)
            if public_match.exists():
                raise serializers.ValidationError({
                    'tittle': (
                        'Este filme já está disponível no catálogo padrão. '
                        'Adicione-o à Minha lista em vez de Meus filmes.'
                    ),
                })

        return attrs

    class Meta:
        model = Movie
        fields = '__all__'
        read_only_fields = ['owner']
