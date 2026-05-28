from pydantic import BaseModel, Field


class MovieCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    year: int | None = Field(default=None, ge=1888, le=2100)
    genres: str = ""
    overview: str | None = None


class MovieResponse(BaseModel):
    id: int
    title: str
    year: int | None
    genres: str
    overview: str | None

    class Config:
        from_attributes = True


class RatingRequest(BaseModel):
    movie_id: int
    score: int = Field(ge=1, le=10)


class WatchlistRequest(BaseModel):
    movie_id: int
    watched: bool = False
