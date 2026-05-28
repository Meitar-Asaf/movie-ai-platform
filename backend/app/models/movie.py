from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    genres: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    ratings = relationship("Rating", back_populates="movie", cascade="all, delete-orphan")
    watchlist_items = relationship("WatchlistItem", back_populates="movie", cascade="all, delete-orphan")
