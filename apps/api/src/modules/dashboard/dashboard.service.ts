import { Injectable } from "@nestjs/common";
import { AttendanceStatus, CourseStatus, PaymentStatus, UserRole } from "@prisma/client";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(user: NonNullable<AuthRequest["user"]>) {
    if (user.role === UserRole.ADMIN) {
      return this.getAdminDashboard();
    }

    if (user.role === UserRole.TEACHER) {
      return this.getTeacherDashboard(user.sub);
    }

    return this.getStudentDashboard(user.sub);
  }

  private async getAdminDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalTeachers,
      totalGroups,
      activeCourses,
      unpaidStudents,
      absentToday,
      incomeAggregate,
      recentActivities
    ] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.group.count({ where: { deletedAt: null } }),
      this.prisma.course.count({ where: { deletedAt: null, status: CourseStatus.ACTIVE } }),
      this.prisma.payment.count({
        where: {
          status: { in: [PaymentStatus.UNPAID, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL] }
        }
      }),
      this.prisma.attendance.count({
        where: {
          status: AttendanceStatus.ABSENT,
          sessionDate: { gte: todayStart }
        }
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidDate: { gte: monthStart }
        },
        _sum: { amount: true }
      }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" }
      })
    ]);

    return {
      role: UserRole.ADMIN,
      summary: {
        totalStudents,
        totalTeachers,
        totalGroups,
        activeCourses,
        monthlyIncome: Number(incomeAggregate._sum.amount ?? 0),
        unpaidStudents,
        absentToday
      },
      recentActivities
    };
  }

  private async getTeacherDashboard(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId },
      include: { groups: true }
    });

    if (!teacher) {
      return { role: UserRole.TEACHER, summary: {} };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const groupIds = teacher.groups.map((group) => group.id);
    const [studentCount, absentToday, unpaidStudents] = await Promise.all([
      this.prisma.studentGroup.count({ where: { groupId: { in: groupIds } } }),
      this.prisma.attendance.count({
        where: {
          groupId: { in: groupIds },
          status: AttendanceStatus.ABSENT,
          sessionDate: { gte: todayStart }
        }
      }),
      this.prisma.payment.count({
        where: {
          status: { in: [PaymentStatus.UNPAID, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL] },
          student: {
            memberships: {
              some: {
                groupId: { in: groupIds }
              }
            }
          }
        }
      })
    ]);

    return {
      role: UserRole.TEACHER,
      summary: {
        todayLessons: teacher.groups.length,
        assignedGroups: teacher.groups.length,
        studentCount,
        absentToday,
        unpaidStudents
      },
      groups: teacher.groups
    };
  }

  private async getStudentDashboard(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        payments: { orderBy: [{ year: "desc" }, { month: "desc" }] },
        attendances: true,
        notes: {
          include: { teacher: true },
          orderBy: { noteDate: "desc" },
          take: 5
        },
        memberships: {
          include: { group: true }
        }
      }
    });

    if (!student) {
      return { role: UserRole.STUDENT, summary: {} };
    }

    const attendancePercentage =
      student.attendances.length === 0
        ? 0
        : Math.round(
            (student.attendances.filter((item) => item.status === AttendanceStatus.PRESENT).length /
              student.attendances.length) *
              100
          );

    return {
      role: UserRole.STUDENT,
      summary: {
        attendancePercentage,
        latestPaymentStatus: student.payments[0]?.status ?? PaymentStatus.UNPAID,
        progressPercent: student.progressPercent,
        groupsCount: student.memberships.length
      },
      notes: student.notes,
      groups: student.memberships
    };
  }
}
