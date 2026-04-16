from pydantic import BaseModel


class CreateGroupInput(BaseModel):
    name: str
    course: str
    teacherId: str
    room: str
    schedule: str


class CreateCourseInput(BaseModel):
    title: str
    price: float


class CreateTeacherInput(BaseModel):
    fullName: str
    phone: str
    email: str | None = None
    password: str
    specialization: str | None = None


class CreateStudentInput(BaseModel):
    fullName: str
    phone: str
    email: str | None = None
    password: str
    parentName: str
    parentPhone: str
    course: str | None = None
    parentTelegramHandle: str | None = None


class AssignStudentInput(BaseModel):
    studentId: str
    groupId: str
    notifyStudent: bool | None = False


class UnassignStudentInput(BaseModel):
    studentId: str
    groupId: str | None = None
    notifyStudent: bool | None = False


class GroupAttendanceEntryInput(BaseModel):
    studentId: str
    status: str
    comment: str | None = None
    sendNotification: bool | None = False


class MarkGroupAttendanceInput(BaseModel):
    groupId: str
    date: str
    lessonTopic: str | None = None
    homeworkTitle: str | None = None
    homeworkDueDate: str | None = None
    entries: list[GroupAttendanceEntryInput]


class SaveAttendanceTopicInput(BaseModel):
    groupId: str
    date: str
    lessonTopic: str


class HomeworkEntryInput(BaseModel):
    studentId: str
    homeworkScore: int
    homeworkComment: str | None = None


class SaveAttendanceHomeworkInput(BaseModel):
    groupId: str
    date: str
    entries: list[HomeworkEntryInput]


class DailyGradeEntryInput(BaseModel):
    studentId: str
    dailyGrade: int
    dailyGradeComment: str | None = None


class SaveAttendanceDailyGradeInput(BaseModel):
    groupId: str
    date: str
    entries: list[DailyGradeEntryInput]


class RecordPaymentInput(BaseModel):
    studentId: str
    month: str
    amount: float
    dueDate: str
    status: str | None = None
    method: str
    sendNotification: bool | None = False


class SendNotificationInput(BaseModel):
    studentId: str | None = None
    studentName: str | None = None
    template: str


class TelegramSettingsInput(BaseModel):
    enabled: bool
    botUsername: str | None = None
    botToken: str | None = None
    welcomeText: str | None = None
    welcomeImageUrl: str | None = None
    notificationImageUrl: str | None = None
    attendanceTemplate: str | None = None
    homeworkTemplate: str | None = None
    paymentTemplate: str | None = None
