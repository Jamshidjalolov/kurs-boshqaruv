from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
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
    User,
    UserStatus,
)
from ..core.security import hash_password
from .common import (
    COURSE_PRICES,
    attendance_note_tag,
    attendance_template,
    default_attendance_comment,
    money_to_text,
    payment_remaining_amount,
    payment_status_for_values,
    payment_status_note_for_values,
    student_query,
    teacher_profile_id_for_user,
    upsert_account_credential,
)
from .live_events import live_events
from .telegram_bot import send_student_notification


def _publish_live(*scopes: str) -> None:
    live_events.publish(list(scopes))


def _today() -> date:
    return datetime.now(ZoneInfo("Asia/Tashkent")).date()


def _ensure_today(session_date: date, action: str) -> None:
    if session_date != _today():
        raise ValueError(f"{action} faqat o'sha kuni mumkin.")


def append_system_message(db: Session, student: Student, title: str, body: str) -> None:
    db.add(
        SystemMessage(
            id=f"msg-{uuid4().hex[:12]}",
            student_id=student.id,
            title=title,
            body=body,
            created_at=datetime.now(),
        )
    )


def append_notification(db: Session, student: Student, template: str) -> Notification:
    return send_student_notification(db, student, template)


def _notify_student_auto(
    db: Session,
    student: Student,
    template: str,
    *,
    custom_text: str | None = None,
) -> bool:
    if not student.parent_telegram_chat_id:
        return False

    try:
        notification = send_student_notification(db, student, template, custom_text=custom_text)
    except Exception:
        return False

    return notification.status == NotificationStatus.SENT


def _homework_score_badge(score: int) -> str:
    if score >= 90:
        return f"🏆 {score}% | A'lo"
    if score >= 75:
        return f"🌟 {score}% | Yaxshi"
    if score >= 60:
        return f"📘 {score}% | O'rta"
    return f"⚠️ {score}% | Diqqat"


def _attendance_auto_text(student: Student, group: Group, session_date: date, status_value: str, lesson_topic: str | None, comment: str) -> str:
    teacher_name = group.teacher.full_name if group.teacher else "Biriktirilmagan"
    status_title = attendance_template(status_value) or "Davomat - Yangilandi"
    status_emoji = {
        AttendanceStatus.PRESENT.value: "🟢",
        AttendanceStatus.ABSENT.value: "🔴",
        AttendanceStatus.LATE.value: "🟡",
        AttendanceStatus.EXCUSED.value: "🔵",
        AttendanceStatus.NOT_PREPARED.value: "🟠",
        AttendanceStatus.HOMEWORK_NOT_DONE.value: "🟣",
    }.get(status_value, "🔹")

    lines = [
        "📊 Kunlik davomat",
        "",
        f"👤 O'quvchi: {student.full_name}",
        f"🏫 Guruh: {group.name}",
        f"📅 Sana: {session_date.strftime('%d.%m.%Y')}",
        f"{status_emoji} Holat: {status_title.replace('Davomat - ', '').replace('Uy vazifasi - ', '')}",
        f"⏰ Jadval: {group.schedule_label}",
        f"👨‍🏫 O'qituvchi: {teacher_name}",
    ]
    if lesson_topic:
        lines.append(f"📘 Mavzu: {lesson_topic}")
    if comment:
        lines.append(f"🗒 Izoh: {comment}")
    return "\n".join(lines)


def _homework_auto_text(student: Student, group: Group, session_date: date, score: int, comment: str | None, lesson_topic: str | None) -> str:
    teacher_name = group.teacher.full_name if group.teacher else "Biriktirilmagan"
    lines = [
        "📝 Uy vazifasi bahosi",
        "",
        f"👤 O'quvchi: {student.full_name}",
        f"🏫 Guruh: {group.name}",
        f"📅 Sana: {session_date.strftime('%d.%m.%Y')}",
        f"🎯 Natija: {_homework_score_badge(score)}",
        f"⏰ Jadval: {group.schedule_label}",
        f"👨‍🏫 O'qituvchi: {teacher_name}",
    ]
    if lesson_topic:
        lines.append(f"📘 Mavzu: {lesson_topic}")
    if comment:
        lines.append(f"💬 Izoh: {comment}")
    return "\n".join(lines)


def _daily_grade_badge(grade: int) -> str:
    if grade >= 5:
        return "🏆 5 | A'lo"
    if grade == 4:
        return "🌟 4 | Yaxshi"
    if grade == 3:
        return "📘 3 | O'rta"
    if grade == 2:
        return "⚠️ 2 | Past"
    return f"📝 {grade} | Baho"


def _daily_grade_auto_text(student: Student, group: Group, session_date: date, grade: int, comment: str | None, lesson_topic: str | None) -> str:
    teacher_name = group.teacher.full_name if group.teacher else "Biriktirilmagan"
    lines = [
        "⭐ Kunlik baho qo'yildi",
        "",
        f"👤 O'quvchi: {student.full_name}",
        f"🏫 Guruh: {group.name}",
        f"📅 Sana: {session_date.strftime('%d.%m.%Y')}",
        f"🎓 Baho: {_daily_grade_badge(grade)}",
        f"⏰ Jadval: {group.schedule_label}",
        f"👨‍🏫 O'qituvchi: {teacher_name}",
    ]
    if lesson_topic:
        lines.append(f"📘 Bugungi mavzu: {lesson_topic}")
    if comment:
        lines.append(f"💬 Izoh: {comment}")
    return "\n".join(lines)


def _payment_auto_text(
    student: Student,
    month_label: str,
    received_amount: Decimal,
    total_amount: Decimal,
    remaining_amount: Decimal,
    status_note: str,
    due_date: date,
) -> str:
    return "\n".join(
        [
            "💳 To'lov yangilandi",
            "",
            f"👤 O'quvchi: {student.full_name}",
            f"🗓 Oy: {month_label}",
            f"💸 Qabul qilindi: {money_to_text(received_amount)}",
            f"💰 Jami to'langan: {money_to_text(total_amount)}",
            f"📌 Qolgan qarz: {money_to_text(remaining_amount)}",
            f"🧾 Holat: {status_note}",
            f"⏳ Muddat: {due_date.strftime('%d.%m.%Y')}",
        ]
    )


def _group_assignment_auto_text(student: Student, group: Group) -> str:
    teacher_name = group.teacher.full_name if group.teacher else "Biriktirilmagan"
    return "\n".join(
        [
            "🎉 Siz yangi guruhga qo'shildingiz",
            "",
            f"👤 O'quvchi: {student.full_name}",
            f"🏫 Guruh: {group.name}",
            f"🧭 Kurs: {group.course.title}",
            f"👨‍🏫 O'qituvchi: {teacher_name}",
            f"⏰ Jadval: {group.schedule_label}",
            f"🚪 Xona: {group.room}",
            "",
            "✨ Darslar bo'yicha barcha yangilanishlar shu bot orqali yuboriladi.",
        ]
    )


def _ensure_user_identity_available(db: Session, *, phone: str, email: str | None = None) -> None:
    normalized_phone = phone.strip()
    normalized_email = email.strip().lower() if email else None

    if db.scalar(select(User.id).where(User.phone == normalized_phone)):
        raise ValueError("Bu telefon bilan foydalanuvchi allaqachon mavjud.")
    if db.scalar(select(Teacher.id).where(Teacher.phone == normalized_phone)):
        raise ValueError("Bu telefon bilan o'qituvchi allaqachon mavjud.")
    if db.scalar(select(Student.id).where(Student.phone == normalized_phone)):
        raise ValueError("Bu telefon bilan o'quvchi allaqachon mavjud.")

    if normalized_email:
        if db.scalar(select(User.id).where(User.email == normalized_email)):
            raise ValueError("Bu email bilan foydalanuvchi allaqachon mavjud.")
        if db.scalar(select(Teacher.id).where(Teacher.email == normalized_email)):
            raise ValueError("Bu email bilan o'qituvchi allaqachon mavjud.")


def create_teacher_account(db: Session, payload: dict[str, str | None]) -> dict[str, object]:
    phone = str(payload["phone"]).strip()
    email = str(payload["email"]).strip().lower() if payload.get("email") else None
    password = str(payload["password"]).strip()
    full_name = str(payload["fullName"]).strip()
    specialization = str(payload.get("specialization") or "").strip() or None

    if not full_name:
        raise ValueError("O'qituvchi ismini kiriting.")
    if not phone:
        raise ValueError("Telefon raqamini kiriting.")
    if len(password) < 6:
        raise ValueError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.")

    _ensure_user_identity_available(db, phone=phone, email=email)

    user = User(
        id=f"user-{uuid4().hex[:12]}",
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        role=Role.TEACHER,
        status=UserStatus.ACTIVE,
    )
    teacher = Teacher(
        id=f"teacher-{uuid4().hex[:10]}",
        user_id=user.id,
        full_name=full_name,
        phone=phone,
        email=email,
        specialization=specialization,
    )

    db.add(user)
    db.add(teacher)
    upsert_account_credential(db, user, user.email or user.phone, password)
    db.commit()
    _publish_live("teachers", "dashboard")

    return {
        "success": True,
        "teacherId": teacher.id,
        "message": f"{teacher.full_name} o'qituvchi sifatida qo'shildi.",
        "loginIdentifier": user.email or user.phone,
        "password": password,
    }


def create_student_account(db: Session, payload: dict[str, str | None]) -> dict[str, object]:
    phone = str(payload["phone"]).strip()
    email = str(payload["email"]).strip().lower() if payload.get("email") else None
    password = str(payload["password"]).strip()
    full_name = str(payload["fullName"]).strip()
    parent_name = str(payload.get("parentName") or "").strip()
    parent_phone = str(payload.get("parentPhone") or "").strip()
    course_title = str(payload.get("course") or "").strip() or None
    parent_telegram_handle = str(payload.get("parentTelegramHandle") or "").strip() or None

    if not full_name:
        raise ValueError("O'quvchi ismini kiriting.")
    if not phone:
        raise ValueError("Telefon raqamini kiriting.")
    if len(password) < 6:
        raise ValueError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.")

    _ensure_user_identity_available(db, phone=phone, email=email)

    course = db.scalar(select(Course).where(Course.title == course_title)) if course_title else None
    user = User(
        id=f"user-{uuid4().hex[:12]}",
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        role=Role.STUDENT,
        status=UserStatus.ACTIVE,
    )
    student = Student(
        id=f"student-{uuid4().hex[:10]}",
        user_id=user.id,
        full_name=full_name,
        phone=phone,
        parent_name=parent_name or "-",
        parent_phone=parent_phone or "-",
        parent_telegram_status=ParentTelegramStatus.CONNECTED if parent_telegram_handle else ParentTelegramStatus.MISSING,
        parent_telegram_handle=parent_telegram_handle,
        course_id=course.id if course else None,
        monthly_fee=COURSE_PRICES.get(course.title, course.price) if course else None,
    )

    db.add(user)
    db.add(student)
    upsert_account_credential(db, user, user.email or user.phone, password)
    db.commit()
    _publish_live("students", "dashboard")

    return {
        "success": True,
        "studentId": student.id,
        "message": f"{student.full_name} o'quvchi sifatida qo'shildi.",
        "loginIdentifier": user.email or user.phone,
        "password": password,
    }


def create_group(db: Session, payload: dict[str, str]) -> dict[str, object]:
    teacher = db.get(Teacher, payload["teacherId"])
    if not teacher:
        raise ValueError("O'qituvchi topilmadi.")

    course = db.scalar(select(Course).where(Course.title == payload["course"]))
    if not course:
        raise ValueError("Kurs topilmadi.")

    if db.scalar(select(Group.id).where(Group.name == payload["name"].strip())):
        raise ValueError("Bu nomdagi guruh allaqachon mavjud.")

    schedule_label = payload["schedule"].strip()
    schedule_days = [item.strip() for item in schedule_label.split("-")[0].split(",") if item.strip()]
    schedule_time = schedule_label.split("-")[-1].strip()

    group = Group(
        id=f"group-{uuid4().hex[:8]}",
        name=payload["name"].strip(),
        course_id=course.id,
        teacher_id=teacher.id,
        room=payload["room"].strip(),
        schedule_days=schedule_days,
        schedule_time=schedule_time,
        schedule_label=schedule_label,
    )
    db.add(group)
    db.commit()
    _publish_live("groups", "dashboard")
    return {"success": True, "groupId": group.id, "message": f"{group.name} guruhi yaratildi."}


def create_course(db: Session, payload: dict[str, object]) -> dict[str, object]:
    title = str(payload["title"]).strip()
    price = Decimal(str(payload["price"]))

    if not title:
        raise ValueError("Kurs nomini kiriting.")
    if price <= 0:
        raise ValueError("Kurs narxini to'g'ri kiriting.")

    if db.scalar(select(Course.id).where(Course.title == title)):
        raise ValueError("Bu nomdagi kurs allaqachon mavjud.")

    course = Course(
        id=f"course-{uuid4().hex[:10]}",
        title=title,
        price=price,
    )
    db.add(course)
    db.commit()
    _publish_live("courses", "groups", "students", "dashboard")
    return {"success": True, "courseId": course.id, "message": f"{course.title} kursi qo'shildi."}


def assign_student_to_group(db: Session, payload: dict[str, object]) -> dict[str, object]:
    student = db.get(Student, str(payload["studentId"]))
    group = db.get(Group, str(payload["groupId"]))

    if not student:
        raise ValueError("O'quvchi topilmadi.")
    if not group:
        raise ValueError("Guruh topilmadi.")
    if student.group_id == group.id:
        raise ValueError(f"{student.full_name} allaqachon {group.name} guruhiga biriktirilgan.")

    student.group_id = group.id
    student.course_id = group.course_id
    student.monthly_fee = COURSE_PRICES.get(group.course.title, group.course.price)

    if payload.get("notifyStudent"):
        append_system_message(
            db,
            student,
            "Guruhga qo'shildingiz",
            f"Siz {group.name} guruhiga qo'shildingiz. Kurs: {group.course.title}. Darslar {group.schedule_label}, xona {group.room}.",
        )

    _notify_student_auto(
        db,
        student,
        "Guruh - Qo'shildi",
        custom_text=_group_assignment_auto_text(student, group),
    )

    db.commit()
    _publish_live("groups", "students", "student-detail", "notifications", "dashboard")
    return {"success": True, "message": f"{student.full_name} {group.name} guruhiga biriktirildi."}


def unassign_student_from_group(db: Session, payload: dict[str, object]) -> dict[str, object]:
    student = db.get(Student, str(payload["studentId"]))
    if not student:
        raise ValueError("O'quvchi topilmadi.")
    if not student.group:
        raise ValueError(f"{student.full_name} hozir hech qaysi guruhga biriktirilmagan.")

    if payload.get("groupId"):
        group = db.get(Group, str(payload["groupId"]))
        if not group:
            raise ValueError("Guruh topilmadi.")
        if student.group_id != group.id:
            raise ValueError(f"{student.full_name} {group.name} guruhida emas.")

    previous_group = student.group.name
    student.group_id = None
    student.course_id = None
    student.monthly_fee = None

    if payload.get("notifyStudent"):
        append_system_message(
            db,
            student,
            "Guruhdan chiqarildingiz",
            f"Siz {previous_group} guruhidan chiqarildingiz. Yangi guruh biriktirilgach bu yerda yangi jadval ko'rinadi.",
        )

    db.commit()
    _publish_live("groups", "students", "student-detail", "dashboard")
    return {"success": True, "message": f"{student.full_name} {previous_group} guruhidan chiqarildi."}


def mark_group_attendance(db: Session, current_user: User, payload: dict[str, object]) -> dict[str, object]:
    group = db.get(Group, str(payload["groupId"]))
    if not group:
        raise ValueError("Guruh topilmadi.")

    session_date = date.fromisoformat(str(payload["date"]))
    _ensure_today(session_date, "Davomatni tahrirlash")

    lesson_topic = str(payload.get("lessonTopic") or "").strip() or None
    homework_title = str(payload.get("homeworkTitle") or "").strip() or None
    homework_due_date = date.fromisoformat(str(payload["homeworkDueDate"])) if homework_title and payload.get("homeworkDueDate") else session_date
    students = {student.id: student for student in db.scalars(select(Student).where(Student.group_id == group.id)).all()}
    teacher_id = teacher_profile_id_for_user(current_user) if current_user.role == Role.TEACHER else group.teacher_id

    for entry in payload["entries"]:
        student = students.get(str(entry["studentId"]))
        if not student:
            continue

        status_value = str(entry["status"])
        comment = str(entry.get("comment") or "").strip() or default_attendance_comment(status_value)
        attendance_entry = db.scalar(
            select(Attendance).where(
                Attendance.student_id == student.id,
                Attendance.group_id == group.id,
                Attendance.session_date == session_date,
            )
        )

        if attendance_entry:
            previous_status = attendance_entry.status
            attendance_entry.teacher_id = teacher_id
            attendance_entry.lesson_topic = lesson_topic
            attendance_entry.status = AttendanceStatus(status_value)
            attendance_entry.comment = comment
            if status_value == AttendanceStatus.ABSENT.value:
                attendance_entry.homework_score = 0
                attendance_entry.homework_comment = None
                attendance_entry.daily_grade = None
                attendance_entry.daily_grade_comment = None
            elif previous_status == AttendanceStatus.ABSENT and attendance_entry.homework_score == 0:
                attendance_entry.homework_score = None
        else:
            attendance_entry = Attendance(
                id=f"att-{uuid4().hex[:12]}",
                student_id=student.id,
                group_id=group.id,
                teacher_id=teacher_id,
                session_date=session_date,
                lesson_topic=lesson_topic,
                status=AttendanceStatus(status_value),
                comment=comment,
                homework_score=0 if status_value == AttendanceStatus.ABSENT.value else None,
            )
            db.add(attendance_entry)

        note_tag = attendance_note_tag(status_value)
        if note_tag:
            db.add(
                TeacherNote(
                    id=f"note-{uuid4().hex[:12]}",
                    student_id=student.id,
                    teacher_id=teacher_id,
                    note_date=session_date,
                    tag=note_tag,
                    comment=comment,
                )
            )

        if entry.get("sendNotification"):
            template = attendance_template(status_value) or "Davomat - Yangilandi"
            _notify_student_auto(
                db,
                student,
                template,
                custom_text=_attendance_auto_text(student, group, session_date, status_value, lesson_topic, comment),
            )

        if homework_title:
            homework_exists = db.scalar(
                select(HomeworkItem.id).where(
                    HomeworkItem.student_id == student.id,
                    HomeworkItem.title == homework_title,
                    HomeworkItem.due_date == homework_due_date,
                )
            )
            if not homework_exists:
                db.add(
                    HomeworkItem(
                        id=f"hw-{uuid4().hex[:12]}",
                        student_id=student.id,
                        title=homework_title,
                        due_date=homework_due_date,
                        status="pending",
                    )
                )

    db.commit()
    _publish_live("attendance", "students", "notifications", "student-detail", "teacher-student", "dashboard")
    return {"success": True, "message": f"{group.name} guruhi uchun {payload['date']} sanasidagi davomat saqlandi."}


def save_attendance_topic(db: Session, payload: dict[str, str]) -> dict[str, object]:
    group = db.get(Group, payload["groupId"])
    if not group:
        raise ValueError("Guruh topilmadi.")

    session_date = date.fromisoformat(payload["date"])
    _ensure_today(session_date, "Dars mavzusini tahrirlash")

    lesson_topic = payload["lessonTopic"].strip()
    if not lesson_topic:
        raise ValueError("Dars mavzusini kiriting.")

    rows = list(db.scalars(select(Attendance).where(Attendance.group_id == group.id, Attendance.session_date == session_date)).all())
    if not rows:
        raise ValueError("Avval shu sana uchun davomatni saqlang.")

    for row in rows:
        row.lesson_topic = lesson_topic

    db.commit()
    _publish_live("attendance", "student-detail", "teacher-student", "dashboard")
    return {"success": True, "message": f"{group.name} guruhi uchun dars mavzusi saqlandi."}


def save_attendance_homework(db: Session, payload: dict[str, object]) -> dict[str, object]:
    group = db.get(Group, str(payload["groupId"]))
    if not group:
        raise ValueError("Guruh topilmadi.")
    if not payload["entries"]:
        raise ValueError("Saqlash uchun homework bahosi tanlanmagan.")

    session_date = date.fromisoformat(str(payload["date"]))
    _ensure_today(session_date, "Uy vazifasi bahosini kiritish")

    for entry in payload["entries"]:
        student = db.get(Student, str(entry["studentId"]))
        if not student:
            raise ValueError("O'quvchi topilmadi.")

        attendance_entry = db.scalar(select(Attendance).where(Attendance.student_id == student.id, Attendance.group_id == group.id, Attendance.session_date == session_date))
        if not attendance_entry:
            raise ValueError("Avval shu sana uchun davomatni saqlang.")
        if attendance_entry.homework_score is not None:
            raise ValueError(f"{student.full_name} uchun homework bahosi allaqachon qo'yilgan.")

        attendance_entry.homework_score = int(entry["homeworkScore"])
        attendance_entry.homework_comment = str(entry.get("homeworkComment") or "").strip() or None
        _notify_student_auto(
            db,
            student,
            "Uy vazifasi - Baho qo'yildi",
            custom_text=_homework_auto_text(
                student,
                group,
                session_date,
                attendance_entry.homework_score,
                attendance_entry.homework_comment,
                attendance_entry.lesson_topic,
            ),
        )

    db.commit()
    _publish_live("attendance", "notifications", "student-detail", "teacher-student", "dashboard")
    return {"success": True, "message": f"{group.name} guruhi uchun homework baholari saqlandi."}


def save_attendance_daily_grade(db: Session, payload: dict[str, object]) -> dict[str, object]:
    group = db.get(Group, str(payload["groupId"]))
    if not group:
        raise ValueError("Guruh topilmadi.")
    if not payload["entries"]:
        raise ValueError("Saqlash uchun kunlik baho tanlanmagan.")

    session_date = date.fromisoformat(str(payload["date"]))
    _ensure_today(session_date, "Kunlik bahoni kiritish")

    for entry in payload["entries"]:
        student = db.get(Student, str(entry["studentId"]))
        if not student:
            raise ValueError("O'quvchi topilmadi.")

        attendance_entry = db.scalar(select(Attendance).where(Attendance.student_id == student.id, Attendance.group_id == group.id, Attendance.session_date == session_date))
        if not attendance_entry:
            raise ValueError("Avval shu sana uchun davomatni saqlang.")
        if attendance_entry.status == AttendanceStatus.ABSENT:
            raise ValueError(f"{student.full_name} kelmaganligi uchun kunlik baho qo'yib bo'lmaydi.")
        if attendance_entry.daily_grade is not None:
            raise ValueError(f"{student.full_name} uchun kunlik baho allaqachon qo'yilgan.")

        daily_grade = int(entry["dailyGrade"])
        if daily_grade < 1 or daily_grade > 5:
            raise ValueError("Kunlik baho 1 dan 5 gacha bo'lishi kerak.")

        attendance_entry.daily_grade = daily_grade
        attendance_entry.daily_grade_comment = str(entry.get("dailyGradeComment") or "").strip() or None
        _notify_student_auto(
            db,
            student,
            "Kunlik baho - Qo'yildi",
            custom_text=_daily_grade_auto_text(
                student,
                group,
                session_date,
                daily_grade,
                attendance_entry.daily_grade_comment,
                attendance_entry.lesson_topic,
            ),
        )

    db.commit()
    _publish_live("attendance", "notifications", "student-detail", "teacher-student", "dashboard")
    return {"success": True, "message": f"{group.name} guruhi uchun kunlik baholar saqlandi."}


def record_payment(db: Session, payload: dict[str, object]) -> dict[str, object]:
    student = db.get(Student, str(payload["studentId"]))
    if not student:
        raise ValueError("O'quvchi topilmadi.")

    payment = db.scalar(select(Payment).where(Payment.student_id == student.id, Payment.month_label == str(payload["month"])))
    received_amount = Decimal(str(payload["amount"]))
    expected_amount = student.monthly_fee or Decimal("0")
    due_date = date.fromisoformat(str(payload["dueDate"]))

    if received_amount <= 0:
        raise ValueError("Qabul qilingan summa 0 dan katta bo'lishi kerak.")

    existing_paid_amount = Decimal(payment.amount) if payment else Decimal("0")
    existing_status = payment_status_for_values(expected_amount, existing_paid_amount, payment.due_date if payment else due_date)
    remaining_before_payment = payment_remaining_amount(expected_amount, existing_paid_amount)

    if payment and existing_status == PaymentStatus.PAID:
        raise ValueError("Bu oy to'liq yopilgan. Qayta to'lov qabul qilinmaydi.")

    if expected_amount > 0 and received_amount > remaining_before_payment:
        raise ValueError(f"Orticha to'lov mumkin emas. Qolgan summa {money_to_text(remaining_before_payment)}.")

    if payment is None:
        payment = Payment(
            id=f"pay-{uuid4().hex[:12]}",
            student_id=student.id,
            month_label=str(payload["month"]),
            amount=received_amount,
            due_date=due_date,
            status=payment_status_for_values(expected_amount, received_amount, due_date),
            method=str(payload["method"]),
        )
        db.add(payment)
        message = "Yangi to'lov yozuvi qo'shildi."
    else:
        payment.amount = Decimal(payment.amount) + received_amount
        payment.due_date = due_date
        payment.method = str(payload["method"])
        message = "To'lov holati yangilandi."

    payment.status = payment_status_for_values(expected_amount, payment.amount, payment.due_date)
    status_note = payment_status_note_for_values(expected_amount, payment.amount, payment.due_date)
    remaining_amount = payment_remaining_amount(expected_amount, payment.amount)

    append_system_message(
        db,
        student,
        "To'lov holati yangilandi",
        (
            f"{payload['month']} uchun {money_to_text(received_amount)} qabul qilindi. "
            f"Jami: {money_to_text(payment.amount)}. "
            f"Qoldiq: {money_to_text(remaining_amount)}. "
            f"Holat: {status_note}."
        ),
    )

    notification_sent = _notify_student_auto(
        db,
        student,
        "To'lov - Yangilandi",
        custom_text=_payment_auto_text(
            student,
            payment.month_label,
            received_amount,
            Decimal(payment.amount),
            remaining_amount,
            status_note,
            payment.due_date,
        ),
    )

    db.commit()
    db.refresh(payment)
    _publish_live("payments", "students", "notifications", "student-detail", "dashboard")
    return {
        "success": True,
        "notificationSent": notification_sent,
        "message": f"{message} Holat: {status_note}. Qoldiq: {money_to_text(remaining_amount)}",
        "payment": {
            "id": payment.id,
            "studentId": student.id,
            "studentName": student.full_name,
            "month": payment.month_label,
            "amount": money_to_text(payment.amount),
            "expectedAmount": money_to_text(expected_amount),
            "remainingAmount": money_to_text(remaining_amount),
            "dueDate": payment.due_date.isoformat(),
            "status": payment.status.value,
            "statusNote": status_note,
            "method": payment.method,
        },
        "receipt": {
            "receiptNumber": f"CHK-{payment.id[-6:].upper()}",
            "studentName": student.full_name,
            "month": payment.month_label,
            "receivedAmount": money_to_text(received_amount),
            "totalPaid": money_to_text(payment.amount),
            "remainingAmount": money_to_text(remaining_amount),
            "expectedAmount": money_to_text(expected_amount),
            "dueDate": payment.due_date.isoformat(),
            "method": payment.method,
            "status": payment.status.value,
            "statusNote": status_note,
            "paidAt": datetime_to_text(payment.updated_at),
        },
    }


def send_notification_to_student(db: Session, student_id: str | None, student_name: str | None, template: str) -> dict[str, object]:
    student = db.scalar(student_query().where(Student.id == student_id)) if student_id else None
    if student is None and student_name:
        student = db.scalar(student_query().where(Student.full_name == student_name))
    if not student:
        raise ValueError("O'quvchi topilmadi.")

    notification = append_notification(db, student, template)
    db.commit()
    _publish_live("notifications", "dashboard")
    if notification.status == NotificationStatus.FAILED:
        raise ValueError("Telegramga yuborilmadi. Bot tokeni yoki foydalanuvchi ulanishini tekshiring.")
    return {"success": True}
