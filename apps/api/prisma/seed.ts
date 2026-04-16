import { randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import {
  AttendanceStatus,
  NotificationChannel,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  StudentStatus,
  TeacherStatus,
  UserRole,
  UserStatus
} from "@prisma/client";

const prisma = new PrismaClient();

const demoAccounts = {
  admin: {
    fullName: "Admin Demo",
    phone: "+998900000101",
    email: "admin.demo@example.com"
  },
  teacher: {
    fullName: "Teacher Demo",
    phone: "+998900000102",
    email: "teacher.demo@example.com"
  },
  student: {
    fullName: "Student Demo",
    phone: "+998900000103",
    email: "student.demo@example.com"
  }
} as const;

let cachedDemoPassword: string | null = null;

function getDemoPassword() {
  if (cachedDemoPassword) {
    return cachedDemoPassword;
  }

  const configuredPassword = process.env.DEMO_USER_PASSWORD?.trim();

  if (configuredPassword) {
    cachedDemoPassword = configuredPassword;
    return cachedDemoPassword;
  }

  cachedDemoPassword = randomBytes(12).toString("base64url");
  // eslint-disable-next-line no-console
  console.warn(`DEMO_USER_PASSWORD is not set. Generated a local-only demo password for this seed run: ${cachedDemoPassword}`);
  return cachedDemoPassword;
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.teacherNote.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentGroup.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.group.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  const demoPassword = getDemoPassword();
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      fullName: demoAccounts.admin.fullName,
      phone: demoAccounts.admin.phone,
      email: demoAccounts.admin.email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  const teacherUser = await prisma.user.create({
    data: {
      fullName: demoAccounts.teacher.fullName,
      phone: demoAccounts.teacher.phone,
      email: demoAccounts.teacher.email,
      passwordHash,
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE
    }
  });

  const studentUser = await prisma.user.create({
    data: {
      fullName: demoAccounts.student.fullName,
      phone: demoAccounts.student.phone,
      email: demoAccounts.student.email,
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE
    }
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      fullName: teacherUser.fullName,
      phone: teacherUser.phone,
      email: teacherUser.email,
      specialization: "IELTS / General English",
      salaryType: "fixed",
      salaryAmount: 12000000,
      status: TeacherStatus.ACTIVE
    }
  });

  const parent = await prisma.parent.create({
    data: {
      fullName: "Dilfuza Parent",
      phone: "+998901234567",
      relation: "Mother",
      telegramChatId: "123456789"
    }
  });

  const course = await prisma.course.create({
    data: {
      title: "English Foundation Pro",
      description: "Modern multi-level English program for teens and adults.",
      duration: 6,
      price: 850000,
      level: "A2-B1"
    }
  });

  const group = await prisma.group.create({
    data: {
      name: "ENG-401",
      courseId: course.id,
      teacherId: teacher.id,
      room: "Room A2",
      capacity: 18,
      scheduleDays: ["Mon", "Wed", "Fri"],
      scheduleTime: "17:00 - 18:30",
      startDate: new Date("2026-04-01T00:00:00.000Z")
    }
  });

  await prisma.schedule.createMany({
    data: [
      { groupId: group.id, dayOfWeek: 1, startTime: "17:00", endTime: "18:30", room: "Room A2" },
      { groupId: group.id, dayOfWeek: 3, startTime: "17:00", endTime: "18:30", room: "Room A2" },
      { groupId: group.id, dayOfWeek: 5, startTime: "17:00", endTime: "18:30", room: "Room A2" }
    ]
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      parentId: parent.id,
      courseId: course.id,
      fullName: studentUser.fullName,
      phone: studentUser.phone,
      parentName: parent.fullName,
      parentPhone: parent.phone,
      parentTelegramChatId: parent.telegramChatId,
      gender: "male",
      address: "Toshkent, Chilonzor",
      status: StudentStatus.ACTIVE,
      joinedAt: new Date("2026-04-01T00:00:00.000Z"),
      paymentPlan: "monthly",
      monthlyFee: 850000,
      progressPercent: 74
    }
  });

  await prisma.studentGroup.create({
    data: {
      studentId: student.id,
      groupId: group.id
    }
  });

  await prisma.payment.createMany({
    data: [
      {
        studentId: student.id,
        amount: 850000,
        dueDate: new Date("2026-04-05T00:00:00.000Z"),
        paidDate: new Date("2026-04-04T00:00:00.000Z"),
        month: 4,
        year: 2026,
        paymentMethod: PaymentMethod.CARD,
        status: PaymentStatus.PAID,
        receiptNumber: "RCPT-2026-0041"
      },
      {
        studentId: student.id,
        amount: 850000,
        dueDate: new Date("2026-05-05T00:00:00.000Z"),
        month: 5,
        year: 2026,
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.UNPAID
      }
    ]
  });

  await prisma.attendance.createMany({
    data: [
      {
        studentId: student.id,
        groupId: group.id,
        teacherId: teacher.id,
        sessionDate: new Date("2026-04-07T00:00:00.000Z"),
        status: AttendanceStatus.PRESENT
      },
      {
        studentId: student.id,
        groupId: group.id,
        teacherId: teacher.id,
        sessionDate: new Date("2026-04-09T00:00:00.000Z"),
        status: AttendanceStatus.LATE,
        comment: "10 minutes late"
      },
      {
        studentId: student.id,
        groupId: group.id,
        teacherId: teacher.id,
        sessionDate: new Date("2026-04-11T00:00:00.000Z"),
        status: AttendanceStatus.NOT_PREPARED,
        comment: "Workbook missing"
      }
    ]
  });

  await prisma.teacherNote.createMany({
    data: [
      {
        studentId: student.id,
        teacherId: teacher.id,
        tag: "GOOD_ACTIVITY",
        comment: "Speaking taskda faol qatnashdi."
      },
      {
        studentId: student.id,
        teacherId: teacher.id,
        tag: "NOT_PREPARED",
        comment: "Bugun daftar va workbook olib kelmadi."
      }
    ]
  });

  await prisma.notificationTemplate.createMany({
    data: [
      {
        key: "attendance_absent",
        name: "Attendance - Absent",
        channel: NotificationChannel.TELEGRAM,
        content:
          "Assalomu alaykum. Sizning farzandingiz {studentName} bugungi darsga kelmadi. Iltimos nazorat qiling. Hurmat bilan, {centerName}."
      },
      {
        key: "attendance_not_prepared",
        name: "Attendance - Not Prepared",
        channel: NotificationChannel.TELEGRAM,
        content:
          "Assalomu alaykum. Sizning farzandingiz {studentName} bugun darsga tayyor holda kelmadi. Iltimos bu holatga e'tibor qarating. Hurmat bilan, {centerName}."
      },
      {
        key: "payment_unpaid",
        name: "Payment - Unpaid",
        channel: NotificationChannel.TELEGRAM,
        content:
          "Assalomu alaykum. {studentName} uchun {month} oyi kurs to'lovi hali amalga oshirilmagan. Iltimos to'lovni o'z vaqtida amalga oshiring. Hurmat bilan, {centerName}."
      }
    ]
  });

  await prisma.notification.create({
    data: {
      studentId: student.id,
      parentId: parent.id,
      senderId: adminUser.id,
      recipient: parent.telegramChatId!,
      channel: NotificationChannel.TELEGRAM,
      status: "SENT",
      message:
        "Assalomu alaykum. Ali Student bugun darsga tayyor holda kelmadi. Iltimos e'tibor qarating. Hurmat bilan, Nova Education Center.",
      sentAt: new Date("2026-04-11T08:30:00.000Z")
    }
  });

  await prisma.systemSetting.createMany({
    data: [
      {
        key: "general.center",
        value: {
          name: "Nova Education Center",
          phone: "+998900001122",
          address: "Toshkent, Chilonzor"
        }
      },
      {
        key: "telegram.notifications",
        value: {
          enabled: true,
          defaultChannel: "TELEGRAM"
        }
      }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: "SEED_BOOTSTRAP",
        entityType: "System",
        entityId: "seed"
      },
      {
        actorId: teacherUser.id,
        action: "ATTENDANCE_MARKED",
        entityType: "Group",
        entityId: group.id
      }
    ]
  });

  // eslint-disable-next-line no-console
  console.log("Seed completed.");
  // eslint-disable-next-line no-console
  console.log({
    admin: { login: adminUser.email ?? adminUser.phone },
    teacher: { login: teacherUser.email ?? teacherUser.phone },
    student: { login: studentUser.email ?? studentUser.phone },
    passwordSource: process.env.DEMO_USER_PASSWORD?.trim() ? "DEMO_USER_PASSWORD" : "generated-local-only"
  });
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
