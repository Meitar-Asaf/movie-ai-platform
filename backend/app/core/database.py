from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


database_url = settings.database_url
parsed_url = make_url(database_url)

# If provider gives a generic PostgreSQL URL, force psycopg driver to match installed dependency.
if parsed_url.drivername == "postgresql":
    database_url = parsed_url.set(drivername="postgresql+psycopg").render_as_string(hide_password=False)

engine = create_engine(
    database_url,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(bind=engine, class_=Session, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
