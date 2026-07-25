import requests
from decouple import config


TMDB_BASE_URL = "https://api.themoviedb.org/3"


def search_trailer(title, release_year=None):
    """Return the best official YouTube trailer found on TMDB."""
    api_key = config("TMDB_API_KEY", default="")
    if not api_key:
        return None

    search_params = {
        "api_key": api_key,
        "query": title,
        "language": "pt-BR",
        "include_adult": "false",
    }
    if release_year:
        search_params["primary_release_year"] = release_year

    try:
        search_response = requests.get(
            f"{TMDB_BASE_URL}/search/movie",
            params=search_params,
            timeout=10,
        )
        search_response.raise_for_status()
        results = search_response.json().get("results", [])
        if not results:
            return None

        movie_id = results[0]["id"]
        videos_response = requests.get(
            f"{TMDB_BASE_URL}/movie/{movie_id}/videos",
            params={"api_key": api_key},
            timeout=10,
        )
        videos_response.raise_for_status()
        videos = videos_response.json().get("results", [])
    except (requests.RequestException, ValueError, KeyError):
        return None

    youtube_videos = [video for video in videos if video.get("site") == "YouTube" and video.get("key")]
    if not youtube_videos:
        return None

    def trailer_priority(video):
        return (
            video.get("type") == "Trailer",
            video.get("official", False),
            video.get("iso_639_1") in {"pt", "en"},
            video.get("published_at", ""),
        )

    selected = max(youtube_videos, key=trailer_priority)
    return f"https://www.youtube.com/watch?v={selected['key']}"
