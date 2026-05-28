from dataclasses import dataclass
from time import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.integrations.poster_client import get_poster_url
from app.models.rating import Rating
from app.models.watchlist import WatchlistItem
from app.schemas.movies import MovieCreateRequest, MovieResponse, RatingRequest, WatchlistRequest


@dataclass
class CatalogMovie:
    movie_key: str
    title: str
    year: int | None
    genres: str
    overview: str | None
    poster_url: str


_catalog_cache: list[CatalogMovie] = []
_catalog_expires_at = 0.0
_CATALOG_TTL_SECONDS = 10 * 60
_FALLBACK_CATALOG: list[dict] = [
    {"title": "Inception", "year": 2010, "genres": "Sci-Fi, Thriller", "overview": "A skilled extractor enters dreams to plant an idea."},
    {"title": "The Dark Knight", "year": 2008, "genres": "Action, Crime", "overview": "Batman faces a chaos-driven criminal mastermind in Gotham."},
    {"title": "Interstellar", "year": 2014, "genres": "Sci-Fi, Drama", "overview": "A team travels through a wormhole to find a new home for humanity."},
    {"title": "The Matrix", "year": 1999, "genres": "Sci-Fi, Action", "overview": "A hacker discovers reality is a simulation and joins a rebellion."},
    {"title": "Whiplash", "year": 2014, "genres": "Drama, Music", "overview": "An ambitious drummer is pushed to his limits by a brutal instructor."},
    {"title": "Parasite", "year": 2019, "genres": "Thriller, Drama", "overview": "A poor family infiltrates a wealthy household with unexpected consequences."},
    {"title": "Dune", "year": 2021, "genres": "Sci-Fi, Adventure", "overview": "A young nobleman must rise to protect his people and destiny."},
    {"title": "Mad Max: Fury Road", "year": 2015, "genres": "Action, Adventure", "overview": "Survivors race across a wasteland in a high-octane escape."},
    {"title": "La La Land", "year": 2016, "genres": "Romance, Music", "overview": "Two dreamers in Los Angeles navigate love and ambition."},
    {"title": "The Grand Budapest Hotel", "year": 2014, "genres": "Comedy, Adventure", "overview": "A legendary concierge and lobby boy become entangled in a caper."},
]


def _movie_key(title: str, year: int | None) -> str:
    base = "".join(ch.lower() if ch.isalnum() else "-" for ch in title).strip("-")
    base = "-".join(part for part in base.split("-") if part)
    return f"{base}-{year}" if year else base


def _normalize_ai_catalog(items: list[dict]) -> list[CatalogMovie]:
    normalized: list[CatalogMovie] = []
    seen: set[str] = set()
    for item in items:
        try:
            title = str(item.get("title", "")).strip()
            if not title:
                continue
            year = item.get("year")
            year = int(year) if year is not None else None
            genres = str(item.get("genres", "")).strip()
            overview = str(item.get("overview", "")).strip() or None
            key = _movie_key(title, year)
            if key in seen:
                continue
            seen.add(key)
            normalized.append(
                CatalogMovie(
                    movie_key=key,
                    title=title,
                    year=year,
                    genres=genres,
                    overview=overview,
                    poster_url=get_poster_url(title, year),
                )
            )
        except (TypeError, ValueError):
            continue
    return normalized


def _refresh_ai_catalog(force: bool = False) -> None:
    global _catalog_cache, _catalog_expires_at

    now = time()
    if not force and _catalog_cache and _catalog_expires_at > now:
        return

    ai_items = GeminiClient().generate_catalog(40)
    normalized = _normalize_ai_catalog(ai_items)
    if normalized:
        _catalog_cache = normalized
    elif not _catalog_cache:
        # Keep the app usable even when Gemini quota/network is unavailable.
        _catalog_cache = _normalize_ai_catalog(_FALLBACK_CATALOG)

    _catalog_expires_at = now + _CATALOG_TTL_SECONDS


def list_movies(db: Session, query: str | None = None) -> list[MovieResponse]:
    _refresh_ai_catalog()

    items = _catalog_cache
    if query:
        query_lower = query.lower()
        items = [movie for movie in items if query_lower in movie.title.lower()]

    return [
        MovieResponse(
            movie_key=movie.movie_key,
            title=movie.title,
            year=movie.year,
            genres=movie.genres,
            overview=movie.overview,
            poster_url=movie.poster_url,
        )
        for movie in items
    ]


def add_movie(db: Session, payload: MovieCreateRequest) -> MovieResponse:
    global _catalog_cache
    movie = CatalogMovie(
        movie_key=_movie_key(payload.title, payload.year),
        title=payload.title,
        year=payload.year,
        genres=payload.genres,
        overview=payload.overview,
        poster_url=payload.poster_url or get_poster_url(payload.title, payload.year),
    )

    _catalog_cache = [m for m in _catalog_cache if m.movie_key != movie.movie_key]
    _catalog_cache.insert(0, movie)

    return MovieResponse(
        movie_key=movie.movie_key,
        title=movie.title,
        year=movie.year,
        genres=movie.genres,
        overview=movie.overview,
        poster_url=movie.poster_url,
    )


def rate_movie(db: Session, user_id: int, payload: RatingRequest) -> None:
    title = payload.title.strip()
    if not title:
        raise ValueError("Movie title is required")

    rating = db.scalar(
        select(Rating).where(Rating.user_id == user_id, Rating.movie_title == title)
    )

    poster_url = payload.poster_url or get_poster_url(title, payload.year)
    if rating is None:
        rating = Rating(
            user_id=user_id,
            movie_title=title,
            movie_year=payload.year,
            movie_genres=payload.genres,
            movie_overview=payload.overview,
            poster_url=poster_url,
            score=payload.score,
        )
        db.add(rating)
    else:
        rating.score = payload.score
        rating.movie_year = payload.year
        rating.movie_genres = payload.genres
        rating.movie_overview = payload.overview
        rating.poster_url = poster_url
    db.commit()


def set_watchlist(db: Session, user_id: int, payload: WatchlistRequest) -> None:
    title = payload.title.strip()
    if not title:
        raise ValueError("Movie title is required")

    item = db.scalar(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.movie_title == title,
        )
    )

    poster_url = payload.poster_url or get_poster_url(title, payload.year)
    if item is None:
        item = WatchlistItem(
            user_id=user_id,
            movie_title=title,
            movie_year=payload.year,
            poster_url=poster_url,
            watched=payload.watched,
        )
        db.add(item)
    else:
        item.watched = payload.watched
        item.movie_year = payload.year
        item.poster_url = poster_url
    db.commit()


def catalog_count() -> int:
    _refresh_ai_catalog()
    return len(_catalog_cache)
