from sqlalchemy import inspect, text

from .base import Base
from .seed import seed_demo_data
from .session import SessionLocal, engine, ensure_database_exists
from ..models import *  # noqa: F403


def apply_schema_updates() -> None:
    inspector = inspect(engine)
    student_columns = {column["name"] for column in inspector.get_columns("students")} if inspector.has_table("students") else set()
    attendance_columns = {column["name"] for column in inspector.get_columns("attendances")} if inspector.has_table("attendances") else set()

    with engine.begin() as connection:
        if "parent_telegram_chat_id" not in student_columns:
            connection.execute(text("ALTER TABLE students ADD COLUMN parent_telegram_chat_id VARCHAR(80)"))
        if "daily_grade" not in attendance_columns:
            connection.execute(text("ALTER TABLE attendances ADD COLUMN daily_grade INTEGER"))
        if "daily_grade_comment" not in attendance_columns:
            connection.execute(text("ALTER TABLE attendances ADD COLUMN daily_grade_comment TEXT"))


def initialize_database() -> None:
    ensure_database_exists(engine.url.render_as_string(hide_password=False))
    Base.metadata.create_all(bind=engine)
    apply_schema_updates()

    with SessionLocal() as session:
        seed_demo_data(session)
