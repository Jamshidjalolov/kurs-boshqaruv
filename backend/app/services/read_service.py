from __future__ import annotations

from decimal import Decimal
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..models import Attendance, Course, Group, Notification, Payment, PaymentStatus, Role, Student, Teacher, User
from .common import (
    account_credential_payload,
    attendance_percent_for_student,
    datetime_to_text,
    effective_parent_telegram_status,
    is_attended,
    latest_payment_for_student,
    money_to_text,
    payment_remaining_amount,
    payment_status_for_values,
    payment_status_note_for_values,
    student_profile_for_user,
    student_payment_status,
    student_query,
    student_summary_payload,
    teacher_profile_id_for_user,
    teacher_query,
    today_iso,
    weekday_code,
)
from .telegram_bot import build_parent_connect_url, get_or_create_telegram_settings


def attendance_entry_payload(entry: Attendance) -> dict[str, object]:
    return {
        "id": entry.id,
        "date": entry.session_date.isoformat(),
        "studentName": entry.student.full_name,
        "group": entry.group.name,
        "lessonTopic": entry.lesson_topic,
        "status": entry.status.value,
        "comment": entry.comment,
        "homeworkScore": entry.homework_score,
        "homeworkComment": entry.homework_comment,
        "dailyGrade": entry.daily_grade,
        "dailyGradeComment": entry.daily_grade_comment,
    }


def payment_payload(entry: Payment) -> dict[str, object]:
    expected_amount = entry.student.monthly_fee if entry.student else 0
    status = payment_status_for_values(expected_amount, entry.amount, entry.due_date)
    return {
        "id": entry.id,
        "studentId": entry.student_id,
        "studentName": entry.student.full_name,
        "month": entry.month_label,
        "amount": money_to_text(entry.amount),
        "expectedAmount": money_to_text(expected_amount),
        "remainingAmount": money_to_text(payment_remaining_amount(expected_amount, entry.amount)),
        "dueDate": entry.due_date.isoformat(),
        "status": status.value,
        "statusNote": payment_status_note_for_values(expected_amount, entry.amount, entry.due_date),
        "method": entry.method,
    }


def notification_payload(entry: Notification) -> dict[str, object]:
    return {
        "id": entry.id,
        "studentName": entry.student.full_name if entry.student else "-",
        "channel": entry.channel,
        "template": entry.template,
        "recipient": entry.recipient,
        "status": entry.status.value,
        "sentAt": datetime_to_text(entry.sent_at),
    }


def chart_from_attendance(entries: list[dict[str, object]]) -> list[dict[str, object]]:
    grouped: dict[str, dict[str, int]] = {}

    for item in entries:
        date_value = str(item["date"])
        bucket = grouped.setdefault(date_value, {"attended": 0, "total": 0})
        bucket["total"] += 1
        if is_attended(str(item["status"])):
            bucket["attended"] += 1

    return [
        {
            "label": date_value,
            "value": round((bucket["attended"] / bucket["total"]) * 100) if bucket["total"] else 0,
        }
        for date_value, bucket in sorted(grouped.items(), key=lambda item: item[0])
    ]


def chart_from_payments(rows: list[Payment]) -> list[dict[str, object]]:
    grouped: dict[str, dict[str, object]] = {}

    for item in rows:
        bucket = grouped.setdefault(item.month_label, {"total": Decimal("0"), "dueDate": item.due_date})
        bucket["total"] = Decimal(str(bucket["total"])) + Decimal(item.amount)
        if item.due_date < bucket["dueDate"]:
            bucket["dueDate"] = item.due_date

    return [
        {
            "label": month_label,
            "value": int(Decimal(str(bucket["total"]))),
        }
        for month_label, bucket in sorted(grouped.items(), key=lambda item: item[1]["dueDate"])
    ]


def list_students_summary(db: Session, current_user: User | None = None) -> list[dict[str, object]]:
    include_credentials = current_user is not None and current_user.role == Role.ADMIN
    settings = get_or_create_telegram_settings(db)
    return [
        student_summary_payload(
            student,
            include_credentials=include_credentials,
            parent_telegram_connect_url=build_parent_connect_url(settings.bot_username, student.id),
        )
        for student in db.scalars(student_query()).all()
    ]


def list_teachers_summary(db: Session, current_user: User | None = None) -> list[dict[str, object]]:
    students = list(db.scalars(student_query()).all())
    result: list[dict[str, object]] = []
    include_credentials = current_user is not None and current_user.role == Role.ADMIN

    for teacher in db.scalars(teacher_query()).all():
        teacher_groups = [group.name for group in teacher.groups]
        student_count = len([student for student in students if student.group and student.group.name in teacher_groups])
        payload: dict[str, object] = {
            "id": teacher.id,
            "fullName": teacher.full_name,
            "phone": teacher.phone,
            "specialization": teacher.specialization or "-",
            "groups": teacher_groups,
            "studentCount": student_count,
            "status": teacher.status.value,
        }

        if include_credentials and teacher.user:
            payload["accountCredentials"] = account_credential_payload(teacher.user)

        result.append(payload)

    return result


def list_groups_summary(db: Session) -> list[dict[str, object]]:
    students = list_students_summary(db)
    groups = db.scalars(select(Group).options(selectinload(Group.course), selectinload(Group.teacher), selectinload(Group.students))).all()

    return [
        {
            "id": group.id,
            "name": group.name,
            "course": group.course.title,
            "teacher": group.teacher.full_name if group.teacher else "-",
            "room": group.room or "-",
            "schedule": group.schedule_label,
            "students": len([student for student in students if student["group"] == group.name]),
            "unpaidStudents": len([student for student in students if student["group"] == group.name and student["paymentStatus"] != PaymentStatus.PAID.value]),
        }
        for group in groups
    ]


def list_courses_summary(db: Session) -> list[dict[str, object]]:
    groups = db.scalars(select(Group).options(selectinload(Group.course), selectinload(Group.students))).all()
    grouped_by_course: dict[str, list[Group]] = {}

    for group in groups:
        grouped_by_course.setdefault(group.course_id, []).append(group)

    rows = db.scalars(select(Course)).all()
    return [
        {
            "id": course.id,
            "title": course.title,
            "price": money_to_text(course.price),
            "priceValue": int(course.price),
            "groupCount": len(grouped_by_course.get(course.id, [])),
            "studentCount": sum(len(group.students) for group in grouped_by_course.get(course.id, [])),
        }
        for course in rows
    ]


def list_attendance_entries(db: Session) -> list[dict[str, object]]:
    rows = db.scalars(select(Attendance).options(selectinload(Attendance.student), selectinload(Attendance.group), selectinload(Attendance.teacher))).all()
    return sorted([attendance_entry_payload(item) for item in rows], key=lambda item: str(item["date"]), reverse=True)


def list_payment_entries(db: Session) -> list[dict[str, object]]:
    rows = db.scalars(select(Payment).options(selectinload(Payment.student))).all()
    return sorted([payment_payload(item) for item in rows], key=lambda item: str(item["dueDate"]), reverse=True)


def list_notification_entries(db: Session) -> list[dict[str, object]]:
    rows = db.scalars(select(Notification).options(selectinload(Notification.student))).all()
    return sorted([notification_payload(item) for item in rows], key=lambda item: str(item["sentAt"]), reverse=True)


def student_detail_payload(db: Session, student_id: str, current_user: User | None = None) -> dict[str, object]:
    student = db.scalar(student_query().where(Student.id == student_id))

    if not student:
        raise ValueError("O'quvchi topilmadi.")

    attendance_timeline = sorted(student.attendances, key=lambda item: item.session_date.isoformat(), reverse=True)
    payments = sorted(student.payments, key=lambda item: item.due_date.isoformat(), reverse=True)
    notes = sorted(student.notes, key=lambda item: item.note_date.isoformat(), reverse=True)
    messages = sorted(student.messages, key=lambda item: item.created_at, reverse=True)
    homework_items = sorted(student.homework_items, key=lambda item: item.due_date.isoformat())
    group = student.group
    group_course_title = group.course.title if group and group.course else "Biriktirilmagan"
    group_teacher_name = group.teacher.full_name if group and group.teacher else "Biriktirilmagan"
    include_credentials = current_user is not None and current_user.role == Role.ADMIN and student.user is not None

    payload: dict[str, object] = {
        "id": student.id,
        "fullName": student.full_name,
        "phone": student.phone,
        "parentName": student.parent_name,
        "parentPhone": student.parent_phone,
        "parentTelegramStatus": effective_parent_telegram_status(student).value,
        "parentTelegramHandle": student.parent_telegram_handle,
        "parentTelegramConnectUrl": build_parent_connect_url(get_or_create_telegram_settings(db).bot_username, student.id),
        "group": student.group.name if student.group else "Biriktirilmagan",
        "course": student.course.title if student.course else "Biriktirilmagan",
        "monthlyFee": money_to_text(student.monthly_fee or 0),
        "teacherName": group_teacher_name,
        "room": group.room if group and group.room else "Biriktirilmagan",
        "schedule": group.schedule_label if group else "Jadval biriktirilmagan",
        "scheduleDays": group.schedule_days if group else [],
        "scheduleTime": group.schedule_time if group else None,
        "groupAssignments": (
            [
                {
                    "id": group.id,
                    "name": group.name,
                    "course": group_course_title,
                    "teacherName": group_teacher_name,
                    "room": group.room or "Biriktirilmagan",
                    "schedule": group.schedule_label,
                    "scheduleDays": group.schedule_days,
                    "scheduleTime": group.schedule_time,
                }
            ]
            if group
            else []
        ),
        "attendanceTimeline": [attendance_entry_payload(item) for item in attendance_timeline],
        "payments": [payment_payload(item) for item in payments],
        "notes": [{"id": item.id, "date": item.note_date.isoformat(), "tag": item.tag, "comment": item.comment} for item in notes],
        "homework": [{"id": item.id, "title": item.title, "dueDate": item.due_date.isoformat(), "status": item.status} for item in homework_items],
        "messages": [{"id": item.id, "title": item.title, "body": item.body, "createdAt": datetime_to_text(item.created_at)} for item in messages],
    }

    if include_credentials:
        payload["accountCredentials"] = account_credential_payload(student.user)

    return payload


def dashboard_payload(db: Session, role: str, current_user: User) -> dict[str, object]:
    today = today_iso()
    today_value = date.today()
    students = list(db.scalars(student_query()).all())
    teachers = list(db.scalars(teacher_query()).all())
    groups = list(db.scalars(select(Group).options(selectinload(Group.course), selectinload(Group.teacher), selectinload(Group.students))).all())
    attendance_rows = list_attendance_entries(db)
    notifications = list_notification_entries(db)
    student_summaries = [student_summary_payload(student) for student in students]

    if role == Role.ADMIN.value:
        payments = db.scalars(select(Payment)).all()
        monthly_income = sum(payment.amount for payment in payments if payment.due_date.year == today_value.year and payment.due_date.month == today_value.month)
        absent_today = len([item for item in attendance_rows if item["date"] == today and item["status"] == "absent"])

        metrics = [
            {"label": "Jami o'quvchilar", "value": str(len(student_summaries)), "change": f"{len([item for item in students if item.parent_telegram_status.value == 'connected'])} tasi ota-onasi bilan bog'langan", "tone": "primary"},
            {"label": "Jami o'qituvchilar", "value": str(len(teachers)), "change": f"{len(groups)} ta faol guruh ishlayapti", "tone": "success"},
            {"label": "Oylik tushum", "value": money_to_text(monthly_income), "change": f"{len([item for item in payments if item.amount > 0])} ta to'lov yozuvi bor", "tone": "success"},
            {"label": "Bugun kelmaganlar", "value": str(absent_today), "change": f"{len([item for item in student_summaries if item['paymentStatus'] != PaymentStatus.PAID.value])} nafar xavfli o'quvchi bor", "tone": "danger"},
        ]
        chart = chart_from_attendance(attendance_rows)
        payment_chart = chart_from_payments(payments)
    elif role == Role.TEACHER.value:
        teacher_profile_id = teacher_profile_id_for_user(current_user)
        teacher_groups = [group for group in groups if group.teacher_id == teacher_profile_id] if teacher_profile_id else []
        teacher_group_names = [group.name for group in teacher_groups]
        teacher_students = [item for item in student_summaries if item["group"] in teacher_group_names]
        teacher_attendance_today = [item for item in attendance_rows if item["date"] == today and item["group"] in teacher_group_names]
        today_lessons = len([group for group in teacher_groups if weekday_code(today) in group.schedule_days])

        metrics = [
            {"label": "Bugungi darslar", "value": str(today_lessons), "change": ", ".join([group.name for group in teacher_groups if weekday_code(today) in group.schedule_days]) or "Bugun dars yo'q", "tone": "primary"},
            {"label": "Biriktirilgan guruhlar", "value": str(len(teacher_groups)), "change": f"{len(teacher_students)} nafar o'quvchi nazoratda", "tone": "success"},
            {"label": "Bugun kelmaganlar", "value": str(len([item for item in teacher_attendance_today if item['status'] == 'absent'])), "change": f"{len([item for item in teacher_attendance_today if item['status'] == 'late'])} nafar kechikkan", "tone": "warning"},
            {"label": "To'lamaganlar", "value": str(len([item for item in teacher_students if item['paymentStatus'] != PaymentStatus.PAID.value])), "change": f"{len([item for item in teacher_students if item['paymentStatus'] == PaymentStatus.OVERDUE.value])} nafar muddati o'tgan", "tone": "danger"},
        ]
        chart = chart_from_attendance([item for item in attendance_rows if item["group"] in teacher_group_names])
        payment_chart = chart
    else:
        student_profile = student_profile_for_user(current_user)
        if not student_profile:
            raise ValueError("O'quvchi profili topilmadi.")

        detail = student_detail_payload(db, student_profile.id)
        latest_payment = latest_payment_for_student(student_profile)
        pending_homework = len([item for item in detail["homework"] if item["status"] == "pending"])
        attendance_percent = attendance_percent_for_student(student_profile)
        progress = round((attendance_percent + (round(((len(detail["homework"]) - pending_homework) / len(detail["homework"])) * 100) if detail["homework"] else 0)) / 2)
        payment_status = student_payment_status(student_profile)

        metrics = [
            {"label": "Davomat", "value": f"{attendance_percent}%", "change": f"{len(detail['attendanceTimeline'])} ta so'nggi dars hisoblandi", "tone": "success" if attendance_percent >= 85 else "warning"},
            {"label": "To'lov holati", "value": "To'langan" if payment_status == PaymentStatus.PAID else "Qisman" if payment_status == PaymentStatus.PARTIAL else "Qarzdorlik" if payment_status == PaymentStatus.OVERDUE else "To'lanmagan", "change": latest_payment.month_label if latest_payment else "To'lov yozuvi topilmadi", "tone": "success" if payment_status == PaymentStatus.PAID else "warning"},
            {"label": "Uy vazifasi", "value": f"{len(detail['homework']) - pending_homework}/{len(detail['homework']) or 0}", "change": f"{pending_homework} ta vazifa kutilmoqda", "tone": "warning" if pending_homework else "primary"},
            {"label": "O'sish", "value": f"{progress}%", "change": "Davomat va vazifa asosida hisoblandi", "tone": "primary"},
        ]
        chart = chart_from_attendance(detail["attendanceTimeline"])  # type: ignore[arg-type]
        payment_chart = chart

    return {"metrics": metrics, "chart": chart, "paymentChart": payment_chart, "activities": notifications[:5]}


def global_search_payload(db: Session, term: str) -> list[dict[str, str]]:
    normalized = term.lower()
    items = [
        *[{"label": item["fullName"], "href": f"/admin/students/{item['id']}", "type": "O'quvchi"} for item in list_students_summary(db)],
        *[{"label": item["name"], "href": "/admin/groups", "type": "Guruh"} for item in list_groups_summary(db)],
        *[{"label": item["fullName"], "href": "/admin/teachers", "type": "O'qituvchi"} for item in list_teachers_summary(db)],
    ]
    return [item for item in items if normalized in item["label"].lower()]
