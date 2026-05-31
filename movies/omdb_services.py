import requests
from decouple import config


def search_movie(title):
    api_key = config("OMDB_API_KEY")
    base_url = config("OMDB_BASE_URL")

    response = requests.get(
        base_url,
        params={
            "apikey": api_key,
            "t": title
        }
    )

    return response.json()