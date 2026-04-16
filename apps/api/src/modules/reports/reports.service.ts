import { Injectable } from "@nestjs/common";
import { AttendanceStatus, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [attendanceStats, paymentStats, riskStudents, topGroups] = await Promise.all([
      this.prisma.attendance.groupBy({
        by: ["status"],
        where: {
          sessionDate: { gte: since }
        },
        _count: { status: true }
      }),
      this.prisma.payment.groupBy({
        by: ["status"],
        _count: { status: true },
        _sum: { amount: true }
      }),
      this.prisma.attendance.groupBy({
        by: ["studentId"],
        where: {
          status: { in: [AttendanceStatus.ABSENT, AttendanceStatus.LATE] },
          sessionDate: { gte: since }
        },
        _count: { studentId: true },
        orderBy: {
          _count: {
            studentId: "desc"
          }
        },
        take: 5
      }),
      this.prisma.group.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { memberships: true }
          }
        },
        orderBy: {
          memberships: {
            _count: "desc"
          }
        },
        take: 5
      })
    ]);

    return {
      attendanceStats,
      paymentStats: paymentStats.map((item) => ({
        ...item,
        totalAmount: Number(item._sum.amount ?? 0)
      })),
      overdueCount: paymentStats.find((item) => item.status === PaymentStatus.OVERDUE)?._count.status ?? 0,
      riskStudents,
      topGroups
    };
  }
}
