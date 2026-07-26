import requests
from decouple import config


class OMDbServiceError(Exception):
    pass


def search_movie(title):
    api_key = config("OMDB_API_KEY")
    base_url = config("OMDB_BASE_URL")

    try:
        response = requests.get(
            base_url,
            params={
                "apikey": api_key,
                "t": title,
            },
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as error:
        raise OMDbServiceError("OMDb indisponível") from error
