from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/movie_ai"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_exp_minutes: int = 60 * 24
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    cors_origins: str = ""
    cors_origin_regex: str = ""

    @model_validator(mode="after")
    def validate_database_url_for_prod(self) -> "Settings":
        if self.app_env.lower() in {"prod", "production"}:
            if "localhost" in self.database_url or "127.0.0.1" in self.database_url:
                raise ValueError("In production, DATABASE_URL must point to managed cloud PostgreSQL")
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
