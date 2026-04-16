from fastapi import APIRouter

from .routes import attendance, auth, courses, dashboard, groups, live, notifications, payments, search, students, teachers, telegram


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(live.router, prefix="/live", tags=["live"])
