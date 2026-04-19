from __future__ import annotations

from collections.abc import Generator

import psycopg
from psycopg import sql
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from ..core.config import get_settings


def _as_psycopg_dsn(database_url: str) -> str:
    return database_url.replace("postgresql+psycopg://", "postgresql://", 1)


def _database_connection_error() -> RuntimeError:
    return RuntimeError(
        "Databasega ulanib bo'lmadi. Render DATABASE_URL qiymatini to'liq Neon connection string "
        "sifatida kiriting: postgresql+psycopg://USER:PASSWORD@HOST/DB?sslmode=require"
    )


def ensure_database_exists(database_url: str) -> None:
    url = make_url(database_url)

    if not url.drivername.startswith("postgresql"):
        return

    database_name = url.database

    if not database_name:
        return

    try:
        with psycopg.connect(_as_psycopg_dsn(url.render_as_string(hide_password=False))):
            return
    except psycopg.OperationalError:
        pass
    except (OSError, UnicodeError, ValueError) as exc:
        raise _database_connection_error() from exc

    admin_url = url.set(database="postgres")

    try:
        with psycopg.connect(_as_psycopg_dsn(admin_url.render_as_string(hide_password=False)), autocommit=True) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database_name,))

                if cursor.fetchone():
                    return

                cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(database_name)))
    except (psycopg.OperationalError, OSError, UnicodeError, ValueError) as exc:
        raise _database_connection_error() from exc


settings = get_settings()
DATABASE_URL = settings.normalized_database_url

engine = create_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()
