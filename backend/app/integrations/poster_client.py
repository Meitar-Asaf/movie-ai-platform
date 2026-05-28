import urllib.parse

import requests

_poster_cache: dict[str, str] = {}


def _placeholder(title: str) -> str:
    encoded = urllib.parse.quote_plus(title[:30] or "Movie")
    return f"https://placehold.co/600x900/0f172a/e2e8f0?text={encoded}"


def get_poster_url(title: str, year: int | None = None) -> str:
    key = f"{title.strip().lower()}::{year or ''}"
    cached = _poster_cache.get(key)
    if cached:
        return cached

    term = f"{title} {year}" if year else title
    url = f"https://itunes.apple.com/search?media=movie&limit=1&term={urllib.parse.quote_plus(term)}"

    try:
        response = requests.get(url, timeout=8)
        response.raise_for_status()
        payload = response.json()
        first = (payload.get("results") or [{}])[0]
        artwork = first.get("artworkUrl100")
        if isinstance(artwork, str) and artwork.strip():
            poster = artwork.replace("100x100bb", "600x600bb")
            _poster_cache[key] = poster
            return poster
    except requests.RequestException:
        pass

    fallback = _placeholder(title)
    _poster_cache[key] = fallback
    return fallback
