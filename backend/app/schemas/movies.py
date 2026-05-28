from pydantic import BaseModel, Field


class MovieCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    year: int | None = Field(default=None, ge=1888, le=2100)
    genres: str = ""
    overview: str | None = None
    poster_url: str | None = None


class MovieResponse(BaseModel):
    movie_key: str
    title: str
    year: int | None
    genres: str
    overview: str | None
    poster_url: str


class MovieIdentity(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    year: int | None = Field(default=None, ge=1888, le=2100)
    genres: str = ""
    overview: str | None = None
    poster_url: str | None = None


class RatingRequest(MovieIdentity):
    score: int = Field(ge=1, le=10)


class WatchlistRequest(MovieIdentity):
    watched: bool = False
