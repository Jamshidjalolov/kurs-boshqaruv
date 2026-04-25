from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class Role(str, Enum):
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"


class TeacherStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"
    NOT_PREPARED = "not_prepared"
    HOMEWORK_NOT_DONE = "homework_not_done"


class PaymentStatus(str, Enum):
    PAID = "paid"
    UNPAID = "unpaid"
    PARTIAL = "partial"
    OVERDUE = "overdue"


class NotificationStatus(str, Enum):
    SENT = "sent"
    FAILED = "failed"


class ParentTelegramStatus(str, Enum):
    CONNECTED = "connected"
    MISSING = "missing"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(140), nullable=False)
    email: Mapped[str | None] = mapped_column(String(160), unique=True)
    phone: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(SqlEnum(Role, native_enum=False), nullable=False)
    is_super_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[UserStatus] = mapped_column(SqlEnum(UserStatus, native_enum=False), default=UserStatus.ACTIVE, nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(255))
    refresh_token_hash: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student_profile: Mapped[Student | None] = relationship(back_populates="user", uselist=False)
    teacher_profile: Mapped[Teacher | None] = relationship(back_populates="user", uselist=False)
    account_credential: Mapped[AccountCredential | None] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    reset_tokens: Mapped[list[PasswordResetToken]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    title: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    students: Mapped[list[Student]] = relationship(back_populates="course")
    groups: Mapped[list[Group]] = relationship(back_populates="course")


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), unique=True)
    full_name: Mapped[str] = mapped_column(String(140), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(160), unique=True)
    specialization: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[TeacherStatus] = mapped_column(SqlEnum(TeacherStatus, native_enum=False), default=TeacherStatus.ACTIVE, nullable=False)

    user: Mapped[User | None] = relationship(back_populates="teacher_profile")
    groups: Mapped[list[Group]] = relationship(back_populates="teacher")
    notes: Mapped[list[TeacherNote]] = relationship(back_populates="teacher")
    attendances_marked: Mapped[list[Attendance]] = relationship(back_populates="teacher")


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    course_id: Mapped[str] = mapped_column(ForeignKey("courses.id"), nullable=False)
    teacher_id: Mapped[str | None] = mapped_column(ForeignKey("teachers.id"))
    room: Mapped[str | None] = mapped_column(String(80))
    schedule_days: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    schedule_time: Mapped[str] = mapped_column(String(40), nullable=False)
    schedule_label: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    course: Mapped[Course] = relationship(back_populates="groups")
    teacher: Mapped[Teacher | None] = relationship(back_populates="groups")
    students: Mapped[list[Student]] = relationship(back_populates="group")
    attendances: Mapped[list[Attendance]] = relationship(back_populates="group")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), unique=True)
    full_name: Mapped[str] = mapped_column(String(140), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    parent_name: Mapped[str] = mapped_column(String(140), nullable=False)
    parent_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    parent_telegram_status: Mapped[ParentTelegramStatus] = mapped_column(
        SqlEnum(ParentTelegramStatus, native_enum=False),
        default=ParentTelegramStatus.MISSING,
        nullable=False,
    )
    parent_telegram_handle: Mapped[str | None] = mapped_column(String(80))
    parent_telegram_chat_id: Mapped[str | None] = mapped_column(String(80))
    group_id: Mapped[str | None] = mapped_column(ForeignKey("groups.id"))
    course_id: Mapped[str | None] = mapped_column(ForeignKey("courses.id"))
    monthly_fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped[User | None] = relationship(back_populates="student_profile")
    group: Mapped[Group | None] = relationship(back_populates="students")
    course: Mapped[Course | None] = relationship(back_populates="students")
    attendances: Mapped[list[Attendance]] = relationship(back_populates="student")
    payments: Mapped[list[Payment]] = relationship(back_populates="student")
    notes: Mapped[list[TeacherNote]] = relationship(back_populates="student")
    homework_items: Mapped[list[HomeworkItem]] = relationship(back_populates="student")
    notifications: Mapped[list[Notification]] = relationship(back_populates="student")
    messages: Mapped[list[SystemMessage]] = relationship(back_populates="student")


class Attendance(Base):
    __tablename__ = "attendances"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False)
    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id"), nullable=False)
    teacher_id: Mapped[str | None] = mapped_column(ForeignKey("teachers.id"))
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    lesson_topic: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[AttendanceStatus] = mapped_column(SqlEnum(AttendanceStatus, native_enum=False), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    homework_score: Mapped[int | None] = mapped_column()
    homework_comment: Mapped[str | None] = mapped_column(Text)
    daily_grade: Mapped[int | None] = mapped_column()
    daily_grade_comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student: Mapped[Student] = relationship(back_populates="attendances")
    group: Mapped[Group] = relationship(back_populates="attendances")
    teacher: Mapped[Teacher | None] = relationship(back_populates="attendances_marked")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False)
    month_label: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(SqlEnum(PaymentStatus, native_enum=False), nullable=False)
    method: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student: Mapped[Student] = relationship(back_populates="payments")


class TeacherNote(Base):
    __tablename__ = "teacher_notes"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False)
    teacher_id: Mapped[str | None] = mapped_column(ForeignKey("teachers.id"))
    note_date: Mapped[date] = mapped_column(Date, nullable=False)
    tag: Mapped[str] = mapped_column(String(60), nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    student: Mapped[Student] = relationship(back_populates="notes")
    teacher: Mapped[Teacher | None] = relationship(back_populates="notes")


class HomeworkItem(Base):
    __tablename__ = "homework_items"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False)

    student: Mapped[Student] = relationship(back_populates="homework_items")


class AccountCredential(Base):
    __tablename__ = "account_credentials"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    login_identifier: Mapped[str] = mapped_column(String(160), nullable=False)
    password_cipher: Mapped[str] = mapped_column(String(600), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="account_credential")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    student_id: Mapped[str | None] = mapped_column(ForeignKey("students.id"))
    channel: Mapped[str] = mapped_column(String(40), default="Telegram", nullable=False)
    template: Mapped[str] = mapped_column(String(140), nullable=False)
    recipient: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(SqlEnum(NotificationStatus, native_enum=False), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    student: Mapped[Student | None] = relationship(back_populates="notifications")


class SystemMessage(Base):
    __tablename__ = "system_messages"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    student: Mapped[Student] = relationship(back_populates="messages")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="reset_tokens")


class TelegramBotSettings(Base):
    __tablename__ = "telegram_bot_settings"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bot_username: Mapped[str | None] = mapped_column(String(120))
    bot_token_cipher: Mapped[str | None] = mapped_column(String(600))
    welcome_text: Mapped[str | None] = mapped_column(Text)
    welcome_image_url: Mapped[str | None] = mapped_column(String(500))
    notification_image_url: Mapped[str | None] = mapped_column(String(500))
    attendance_template: Mapped[str | None] = mapped_column(Text)
    homework_template: Mapped[str | None] = mapped_column(Text)
    payment_template: Mapped[str | None] = mapped_column(Text)
    last_update_id: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


ModelType = User | Course | Teacher | Group | Student | Attendance | Payment | TeacherNote | HomeworkItem | AccountCredential | Notification | SystemMessage | PasswordResetToken | TelegramBotSettings
