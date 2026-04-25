from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..core.security import encrypt_secret, hash_password
from ..models import (
    AccountCredential,
    Attendance,
    AttendanceStatus,
    Course,
    Group,
    HomeworkItem,
    Notification,
    NotificationStatus,
    ParentTelegramStatus,
    Payment,
    PaymentStatus,
    Role,
    Student,
    SystemMessage,
    Teacher,
    TeacherNote,
    TeacherStatus,
    User,
    UserStatus,
)


def _d(value: str) -> date:
    return date.fromisoformat(value)


def _dt(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d %H:%M")


DEMO_ACCOUNTS = {
    "admin": {
        "id": "admin-1",
        "full_name": "Admin Demo",
        "email": "jamshidjalolov6767@gmail.com",
        "phone": "+998900000101",
    },
    "teacher": {
        "id": "teacher-1",
        "full_name": "Teacher Demo",
        "email": "teacher.demo@example.com",
        "phone": "+998900000102",
    },
    "student": {
        "id": "student-1",
        "full_name": "Student Demo",
        "email": "student.demo@example.com",
        "phone": "+998900000103",
        "parent_name": "Parent Demo",
        "parent_phone": "+998900000201",
        "parent_telegram_handle": "@parent_demo",
    },
}

_demo_password_cache: str | None = None
DEFAULT_DEMO_PASSWORD = "jamshid4884"


def _configured_demo_password() -> str:
    configured = (get_settings().demo_user_password or "").strip()
    return configured or DEFAULT_DEMO_PASSWORD


def _get_demo_password() -> str:
    global _demo_password_cache

    if _demo_password_cache:
        return _demo_password_cache

    configured = _configured_demo_password()

    _demo_password_cache = configured
    return _demo_password_cache


def _existing_user_id_for_email(db: Session, email: str, *, exclude_user_id: str | None = None) -> str | None:
    statement = select(User.id).where(User.email == email)
    if exclude_user_id is not None:
        statement = statement.where(User.id != exclude_user_id)
    return db.scalar(statement)


def _resolved_demo_login_user(db: Session, default_user_id: str, login_identifier: str) -> User | None:
    login_owner_id = _existing_user_id_for_email(db, login_identifier)
    if login_owner_id:
        return db.get(User, login_owner_id)
    return db.get(User, default_user_id)


def ensure_demo_users(db: Session, demo_password: str) -> None:
    user_defaults = [
        ("admin", Role.ADMIN),
        ("teacher", Role.TEACHER),
        ("student", Role.STUDENT),
    ]

    for account_key, role in user_defaults:
        account = DEMO_ACCOUNTS[account_key]
        user = db.get(User, account["id"])

        if not user:
            db.add(
                User(
                    id=account["id"],
                    full_name=account["full_name"],
                    email=account["email"],
                    phone=account["phone"],
                    password_hash=hash_password(demo_password),
                    role=role,
                    status=UserStatus.ACTIVE,
                )
            )
            continue

        user.full_name = account["full_name"]
        if not _existing_user_id_for_email(db, account["email"], exclude_user_id=account["id"]):
            user.email = account["email"]
        user.phone = account["phone"]
        user.role = role
        user.status = UserStatus.ACTIVE

    teacher_account = DEMO_ACCOUNTS["teacher"]
    teacher = db.get(Teacher, teacher_account["id"])
    if not teacher:
        db.add(
            Teacher(
                id=teacher_account["id"],
                user_id=teacher_account["id"],
                full_name=teacher_account["full_name"],
                phone=teacher_account["phone"],
                email=teacher_account["email"],
                specialization="IELTS / Umumiy ingliz tili",
                status=TeacherStatus.ACTIVE,
            )
        )
    elif teacher.user_id in (None, teacher_account["id"]):
        teacher.user_id = teacher_account["id"]
        teacher.full_name = teacher_account["full_name"]
        teacher.phone = teacher_account["phone"]
        teacher.email = teacher_account["email"]
        teacher.status = TeacherStatus.ACTIVE

    student_account = DEMO_ACCOUNTS["student"]
    student = db.get(Student, student_account["id"])
    if not student:
        group_id = "group-1" if db.get(Group, "group-1") else None
        course_id = "course-1" if db.get(Course, "course-1") else None
        db.add(
            Student(
                id=student_account["id"],
                user_id=student_account["id"],
                full_name=student_account["full_name"],
                phone=student_account["phone"],
                parent_name=student_account["parent_name"],
                parent_phone=student_account["parent_phone"],
                parent_telegram_status=ParentTelegramStatus.CONNECTED,
                parent_telegram_handle=student_account["parent_telegram_handle"],
                group_id=group_id,
                course_id=course_id,
                monthly_fee=Decimal("850000"),
            )
        )
    elif student.user_id in (None, student_account["id"]):
        student.user_id = student_account["id"]
        student.full_name = student_account["full_name"]
        student.phone = student_account["phone"]
        student.parent_name = student_account["parent_name"]
        student.parent_phone = student_account["parent_phone"]
        student.parent_telegram_status = ParentTelegramStatus.CONNECTED
        student.parent_telegram_handle = student_account["parent_telegram_handle"]


def ensure_demo_credentials(db: Session) -> None:
    demo_password = _get_demo_password()
    configured_password = _configured_demo_password()
    ensure_demo_users(db, demo_password)
    defaults = [
        ("cred-admin-1", "admin-1", DEMO_ACCOUNTS["admin"]["email"], demo_password),
        ("cred-teacher-1", "teacher-1", DEMO_ACCOUNTS["teacher"]["email"], demo_password),
        ("cred-student-1", "student-1", DEMO_ACCOUNTS["student"]["email"], demo_password),
    ]

    for credential_id, user_id, login_identifier, password in defaults:
        user = _resolved_demo_login_user(db, user_id, login_identifier)
        if not user:
            continue
        credential = db.scalar(select(AccountCredential).where(AccountCredential.user_id == user.id))
        if credential:
            credential.login_identifier = login_identifier
            if configured_password:
                user.password_hash = hash_password(password)
                credential.password_cipher = encrypt_secret(password)
            continue

        user.password_hash = hash_password(password)
        db.add(
            AccountCredential(
                id=credential_id if user.id == user_id else f"cred-{user.id}",
                user_id=user.id,
                login_identifier=login_identifier,
                password_cipher=encrypt_secret(password),
            )
        )

    db.commit()


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        ensure_demo_credentials(db)
        return

    demo_password = _get_demo_password()

    db.add_all(
        [
            User(id=DEMO_ACCOUNTS["admin"]["id"], full_name=DEMO_ACCOUNTS["admin"]["full_name"], email=DEMO_ACCOUNTS["admin"]["email"], phone=DEMO_ACCOUNTS["admin"]["phone"], password_hash=hash_password(demo_password), role=Role.ADMIN, status=UserStatus.ACTIVE),
            User(id=DEMO_ACCOUNTS["teacher"]["id"], full_name=DEMO_ACCOUNTS["teacher"]["full_name"], email=DEMO_ACCOUNTS["teacher"]["email"], phone=DEMO_ACCOUNTS["teacher"]["phone"], password_hash=hash_password(demo_password), role=Role.TEACHER, status=UserStatus.ACTIVE),
            User(id=DEMO_ACCOUNTS["student"]["id"], full_name=DEMO_ACCOUNTS["student"]["full_name"], email=DEMO_ACCOUNTS["student"]["email"], phone=DEMO_ACCOUNTS["student"]["phone"], password_hash=hash_password(demo_password), role=Role.STUDENT, status=UserStatus.ACTIVE),
        ]
    )

    db.add_all(
        [
            AccountCredential(id="cred-admin-1", user_id="admin-1", login_identifier=DEMO_ACCOUNTS["admin"]["email"], password_cipher=encrypt_secret(demo_password)),
            AccountCredential(id="cred-teacher-1", user_id="teacher-1", login_identifier=DEMO_ACCOUNTS["teacher"]["email"], password_cipher=encrypt_secret(demo_password)),
            AccountCredential(id="cred-student-1", user_id="student-1", login_identifier=DEMO_ACCOUNTS["student"]["email"], password_cipher=encrypt_secret(demo_password)),
        ]
    )

    db.add_all(
        [
            Course(id="course-1", title="Ingliz tili asoslari", price=Decimal("850000")),
            Course(id="course-2", title="Matematika tezkor kursi", price=Decimal("920000")),
            Course(id="course-3", title="IELTS intensiv", price=Decimal("1100000")),
        ]
    )

    db.add_all(
        [
            Teacher(id="teacher-1", user_id="teacher-1", full_name=DEMO_ACCOUNTS["teacher"]["full_name"], phone=DEMO_ACCOUNTS["teacher"]["phone"], email=DEMO_ACCOUNTS["teacher"]["email"], specialization="IELTS / Umumiy ingliz tili", status=TeacherStatus.ACTIVE),
            Teacher(id="teacher-2", user_id=None, full_name="Diyor Qodirov", phone="+998909009900", email=None, specialization="Matematika", status=TeacherStatus.ACTIVE),
        ]
    )

    db.add_all(
        [
            Group(id="group-1", name="ENG-401", course_id="course-1", teacher_id="teacher-1", room="A2 xona", schedule_days=["Du", "Cho", "Ju"], schedule_time="17:00", schedule_label="Du, Cho, Ju - 17:00"),
            Group(id="group-2", name="MATH-220", course_id="course-2", teacher_id="teacher-2", room="B1 xona", schedule_days=["Se", "Pa", "Sha"], schedule_time="15:30", schedule_label="Se, Pa, Sha - 15:30"),
            Group(id="group-3", name="IELTS-710", course_id="course-3", teacher_id="teacher-1", room="C3 xona", schedule_days=["Se", "Pa", "Sha"], schedule_time="18:30", schedule_label="Se, Pa, Sha - 18:30"),
        ]
    )

    db.add_all(
        [
            Student(id="student-1", user_id="student-1", full_name=DEMO_ACCOUNTS["student"]["full_name"], phone=DEMO_ACCOUNTS["student"]["phone"], parent_name=DEMO_ACCOUNTS["student"]["parent_name"], parent_phone=DEMO_ACCOUNTS["student"]["parent_phone"], parent_telegram_status=ParentTelegramStatus.CONNECTED, parent_telegram_handle=DEMO_ACCOUNTS["student"]["parent_telegram_handle"], group_id="group-1", course_id="course-1", monthly_fee=Decimal("850000")),
            Student(id="student-2", user_id=None, full_name="Malika Asadova", phone="+998901110022", parent_name="Gulbahor Asadova", parent_phone="+998901110023", parent_telegram_status=ParentTelegramStatus.MISSING, parent_telegram_handle=None, group_id="group-1", course_id="course-1", monthly_fee=Decimal("850000")),
            Student(id="student-3", user_id=None, full_name="Jasur Karimov", phone="+998907770011", parent_name="Karim Karimov", parent_phone="+998907770012", parent_telegram_status=ParentTelegramStatus.CONNECTED, parent_telegram_handle="@karim_parent", group_id="group-2", course_id="course-2", monthly_fee=Decimal("920000")),
            Student(id="student-4", user_id=None, full_name="Mohira Tursunova", phone="+998909991101", parent_name="Nigora Tursunova", parent_phone="+998909991102", parent_telegram_status=ParentTelegramStatus.CONNECTED, parent_telegram_handle="@mohira_parent", group_id="group-2", course_id="course-2", monthly_fee=Decimal("920000")),
            Student(id="student-5", user_id=None, full_name="Bekzod Umarov", phone="+998905551144", parent_name="Umida Umarova", parent_phone="+998905551145", parent_telegram_status=ParentTelegramStatus.CONNECTED, parent_telegram_handle="@umarova_parent", group_id="group-3", course_id="course-3", monthly_fee=Decimal("1100000")),
            Student(id="student-6", user_id=None, full_name="Shahzoda Aliyeva", phone="+998907001133", parent_name="Gavhar Aliyeva", parent_phone="+998907001134", parent_telegram_status=ParentTelegramStatus.CONNECTED, parent_telegram_handle="@shahzoda_parent", group_id="group-3", course_id="course-3", monthly_fee=Decimal("1100000")),
        ]
    )

    db.add_all(
        [
            Attendance(id="att-1", student_id="student-1", group_id="group-1", teacher_id="teacher-1", session_date=_d("2026-04-07"), status=AttendanceStatus.PRESENT, homework_score=90),
            Attendance(id="att-2", student_id="student-1", group_id="group-1", teacher_id="teacher-1", session_date=_d("2026-04-09"), status=AttendanceStatus.LATE, comment="8 daqiqa kechikdi", homework_score=75),
            Attendance(id="att-3", student_id="student-1", group_id="group-1", teacher_id="teacher-1", session_date=_d("2026-04-11"), status=AttendanceStatus.NOT_PREPARED, comment="Daftar va kitobsiz keldi", homework_score=40),
            Attendance(id="att-4", student_id="student-2", group_id="group-1", teacher_id="teacher-1", session_date=_d("2026-04-07"), status=AttendanceStatus.PRESENT, homework_score=100),
            Attendance(id="att-5", student_id="student-2", group_id="group-1", teacher_id="teacher-1", session_date=_d("2026-04-09"), status=AttendanceStatus.PRESENT, homework_score=95),
            Attendance(id="att-6", student_id="student-2", group_id="group-1", teacher_id="teacher-1", session_date=_d("2026-04-11"), status=AttendanceStatus.PRESENT, homework_score=90),
            Attendance(id="att-7", student_id="student-3", group_id="group-2", teacher_id="teacher-2", session_date=_d("2026-04-08"), status=AttendanceStatus.PRESENT, homework_score=85),
            Attendance(id="att-8", student_id="student-3", group_id="group-2", teacher_id="teacher-2", session_date=_d("2026-04-10"), status=AttendanceStatus.HOMEWORK_NOT_DONE, comment="Uy vazifasi to'liq emas", homework_score=20),
            Attendance(id="att-9", student_id="student-3", group_id="group-2", teacher_id="teacher-2", session_date=_d("2026-04-11"), status=AttendanceStatus.LATE, comment="12 daqiqa kechikdi", homework_score=70),
            Attendance(id="att-10", student_id="student-4", group_id="group-2", teacher_id="teacher-2", session_date=_d("2026-04-08"), status=AttendanceStatus.ABSENT, comment="Sababsiz kelmadi", homework_score=0),
            Attendance(id="att-11", student_id="student-4", group_id="group-2", teacher_id="teacher-2", session_date=_d("2026-04-10"), status=AttendanceStatus.PRESENT, homework_score=88),
            Attendance(id="att-12", student_id="student-4", group_id="group-2", teacher_id="teacher-2", session_date=_d("2026-04-11"), status=AttendanceStatus.ABSENT, comment="Bugun ham kelmadi", homework_score=0),
            Attendance(id="att-13", student_id="student-5", group_id="group-3", teacher_id="teacher-1", session_date=_d("2026-04-08"), status=AttendanceStatus.PRESENT, homework_score=92),
            Attendance(id="att-14", student_id="student-5", group_id="group-3", teacher_id="teacher-1", session_date=_d("2026-04-10"), status=AttendanceStatus.EXCUSED, comment="Tibbiy ma'lumotnoma bor", homework_score=None),
            Attendance(id="att-15", student_id="student-5", group_id="group-3", teacher_id="teacher-1", session_date=_d("2026-04-11"), status=AttendanceStatus.PRESENT, homework_score=100),
            Attendance(id="att-16", student_id="student-6", group_id="group-3", teacher_id="teacher-1", session_date=_d("2026-04-08"), status=AttendanceStatus.PRESENT, homework_score=85),
            Attendance(id="att-17", student_id="student-6", group_id="group-3", teacher_id="teacher-1", session_date=_d("2026-04-10"), status=AttendanceStatus.ABSENT, comment="Ota-onaga qo'ng'iroq qilingan", homework_score=0),
            Attendance(id="att-18", student_id="student-6", group_id="group-3", teacher_id="teacher-1", session_date=_d("2026-04-11"), status=AttendanceStatus.PRESENT, homework_score=80),
        ]
    )

    db.add_all(
        [
            Payment(id="pay-1", student_id="student-1", month_label="2026-yil mart", amount=Decimal("850000"), due_date=_d("2026-03-05"), status=PaymentStatus.PAID, method="Naqd"),
            Payment(id="pay-2", student_id="student-1", month_label="2026-yil aprel", amount=Decimal("850000"), due_date=_d("2026-04-05"), status=PaymentStatus.OVERDUE, method="Karta"),
            Payment(id="pay-3", student_id="student-2", month_label="2026-yil aprel", amount=Decimal("850000"), due_date=_d("2026-04-05"), status=PaymentStatus.PAID, method="Naqd"),
            Payment(id="pay-4", student_id="student-3", month_label="2026-yil aprel", amount=Decimal("920000"), due_date=_d("2026-04-05"), status=PaymentStatus.PARTIAL, method="Bank o'tkazmasi"),
            Payment(id="pay-5", student_id="student-4", month_label="2026-yil aprel", amount=Decimal("920000"), due_date=_d("2026-04-05"), status=PaymentStatus.UNPAID, method="Naqd"),
            Payment(id="pay-6", student_id="student-5", month_label="2026-yil aprel", amount=Decimal("1100000"), due_date=_d("2026-04-05"), status=PaymentStatus.PAID, method="Karta"),
            Payment(id="pay-7", student_id="student-6", month_label="2026-yil mart", amount=Decimal("1100000"), due_date=_d("2026-03-05"), status=PaymentStatus.PAID, method="Karta"),
            Payment(id="pay-8", student_id="student-6", month_label="2026-yil aprel", amount=Decimal("1100000"), due_date=_d("2026-04-05"), status=PaymentStatus.OVERDUE, method="Karta"),
        ]
    )

    db.add_all(
        [
            TeacherNote(id="note-1", student_id="student-1", teacher_id="teacher-1", note_date=_d("2026-04-11"), tag="NOT_PREPARED", comment="Bugun daftar, kitob va qalam to'liq emas edi."),
            TeacherNote(id="note-2", student_id="student-1", teacher_id="teacher-1", note_date=_d("2026-04-09"), tag="GOOD_ACTIVITY", comment="Speaking mashg'ulotida yaxshi qatnashdi."),
            TeacherNote(id="note-3", student_id="student-2", teacher_id="teacher-1", note_date=_d("2026-04-11"), tag="EXCELLENT_PARTICIPATION", comment="Bugungi darsda faolligi juda yaxshi bo'ldi."),
            TeacherNote(id="note-4", student_id="student-3", teacher_id="teacher-2", note_date=_d("2026-04-10"), tag="HOMEWORK_NOT_DONE", comment="Uy vazifasi 50 foiz bajarilgan."),
            TeacherNote(id="note-5", student_id="student-4", teacher_id="teacher-2", note_date=_d("2026-04-11"), tag="PARENT_CALL_REQUIRED", comment="Ikki marta ketma-ket dars qoldirdi."),
            TeacherNote(id="note-6", student_id="student-6", teacher_id="teacher-1", note_date=_d("2026-04-10"), tag="LOW_DISCIPLINE", comment="Darsdan oldin kech javob berdi, nazorat kerak."),
        ]
    )

    db.add_all(
        [
            HomeworkItem(id="hw-1", student_id="student-1", title="5-bo'lim lug'at mashqi", due_date=_d("2026-04-13"), status="pending"),
            HomeworkItem(id="hw-2", student_id="student-1", title="Listening practice 3", due_date=_d("2026-04-10"), status="submitted"),
            HomeworkItem(id="hw-3", student_id="student-2", title="Grammar workbook 8-bet", due_date=_d("2026-04-13"), status="submitted"),
            HomeworkItem(id="hw-4", student_id="student-2", title="Reading check-list", due_date=_d("2026-04-15"), status="pending"),
            HomeworkItem(id="hw-5", student_id="student-3", title="Tenglamalar to'plami", due_date=_d("2026-04-12"), status="pending"),
            HomeworkItem(id="hw-6", student_id="student-3", title="Geometriya savollari", due_date=_d("2026-04-09"), status="submitted"),
            HomeworkItem(id="hw-7", student_id="student-4", title="Kasrlar amaliyoti", due_date=_d("2026-04-12"), status="pending"),
            HomeworkItem(id="hw-8", student_id="student-5", title="Essay task 2", due_date=_d("2026-04-14"), status="submitted"),
            HomeworkItem(id="hw-9", student_id="student-6", title="Reading test 5", due_date=_d("2026-04-12"), status="pending"),
        ]
    )

    db.add_all(
        [
            Notification(id="notif-1", student_id="student-1", channel="Telegram", template="Davomat - Tayyor emas", recipient="@zarina_parent", status=NotificationStatus.SENT, sent_at=_dt("2026-04-11 13:22")),
            Notification(id="notif-2", student_id="student-4", channel="Telegram", template="Davomat - Kelmadi", recipient="@mohira_parent", status=NotificationStatus.SENT, sent_at=_dt("2026-04-11 10:08")),
            Notification(id="notif-3", student_id="student-6", channel="Telegram", template="To'lov - Qilinmagan", recipient="@shahzoda_parent", status=NotificationStatus.SENT, sent_at=_dt("2026-04-10 19:08")),
            Notification(id="notif-4", student_id="student-3", channel="Telegram", template="Uy vazifasi - Bajarilmagan", recipient="@karim_parent", status=NotificationStatus.SENT, sent_at=_dt("2026-04-10 18:16")),
        ]
    )

    db.add_all(
        [
            SystemMessage(id="msg-1", student_id="student-1", title="Guruhga biriktirildingiz", body="Siz ENG-401 guruhiga muvaffaqiyatli biriktirildingiz. Dars jadvalini tekshirib chiqing.", created_at=_dt("2026-04-09 09:00")),
            SystemMessage(id="msg-2", student_id="student-1", title="To'lov holati yangilandi", body="2026-yil aprel oyi uchun to'lov holatingiz yangilandi.", created_at=_dt("2026-04-10 18:40")),
        ]
    )

    db.commit()
