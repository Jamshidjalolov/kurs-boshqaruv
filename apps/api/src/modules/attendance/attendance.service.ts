import { BadRequestException, Injectable } from "@nestjs/common";
import { AttendanceStatus, NoteTag, UserRole } from "@prisma/client";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { MarkAttendanceDto } from "./dto/attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveTeacherId(actor: NonNullable<AuthRequest["user"]>, fallbackTeacherId?: string) {
    if (actor.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: actor.sub }
      });

      if (!teacher) {
        throw new BadRequestException("Teacher profile not found.");
      }

      return teacher.id;
    }

    if (fallbackTeacherId) {
      return fallbackTeacherId;
    }

    throw new BadRequestException("teacherId is required for admin attendance marking.");
  }

  async mark(dto: MarkAttendanceDto, actor: NonNullable<AuthRequest["user"]>) {
    const teacherId = await this.resolveTeacherId(actor, dto.teacherId);
    const sessionDate = new Date(dto.sessionDate);

    const result = await this.prisma.$transaction(async (tx) => {
      const upserts = await Promise.all(
        dto.records.map(async (record) => {
          const attendance = await tx.attendance.upsert({
            where: {
              studentId_groupId_sessionDate: {
                studentId: record.studentId,
                groupId: dto.groupId,
                sessionDate
              }
            },
            update: {
              status: record.status,
              comment: record.comment,
              teacherId
            },
            create: {
              studentId: record.studentId,
              groupId: dto.groupId,
              teacherId,
              sessionDate,
              status: record.status,
              comment: record.comment
            }
          });

          if (
            record.status === AttendanceStatus.NOT_PREPARED ||
            record.status === AttendanceStatus.HOMEWORK_NOT_DONE
          ) {
            await tx.teacherNote.create({
              data: {
                studentId: record.studentId,
                teacherId,
                tag:
                  record.status === AttendanceStatus.NOT_PREPARED
                    ? NoteTag.NOT_PREPARED
                    : NoteTag.HOMEWORK_NOT_DONE,
                comment: record.comment
              }
            });
          }

          return attendance;
        })
      );

      await tx.auditLog.create({
        data: {
          actorId: actor.sub,
          action: "ATTENDANCE_MARKED",
          entityType: "Attendance",
          entityId: dto.groupId,
          meta: {
            count: dto.records.length,
            sessionDate: dto.sessionDate
          }
        }
      });

      return upserts;
    });

    return {
      message: "Attendance saved successfully.",
      items: result
    };
  }

  async getGroupAttendance(groupId: string, sessionDate?: string, actor?: AuthRequest["user"]) {
    const dateFilter = sessionDate ? new Date(sessionDate) : undefined;

    return this.prisma.attendance.findMany({
      where: {
        groupId,
        ...(dateFilter ? { sessionDate: dateFilter } : {}),
        ...(actor?.role === UserRole.TEACHER
          ? {
              group: {
                teacher: {
                  userId: actor.sub
                }
              }
            }
          : {})
      },
      include: {
        student: true,
        group: true,
        teacher: true
      },
      orderBy: { student: { fullName: "asc" } }
    });
  }

  async getSummary(actor?: AuthRequest["user"]) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const baseWhere = {
      sessionDate: {
        gte: todayStart,
        lt: todayEnd
      },
      ...(actor?.role === UserRole.TEACHER
        ? {
            group: {
              teacher: {
                userId: actor.sub
              }
            }
          }
        : {}),
      ...(actor?.role === UserRole.STUDENT
        ? {
            student: {
              userId: actor.sub
            }
          }
        : {})
    };

    const [present, absent, late, excused] = await Promise.all([
      this.prisma.attendance.count({ where: { ...baseWhere, status: AttendanceStatus.PRESENT } }),
      this.prisma.attendance.count({ where: { ...baseWhere, status: AttendanceStatus.ABSENT } }),
      this.prisma.attendance.count({ where: { ...baseWhere, status: AttendanceStatus.LATE } }),
      this.prisma.attendance.count({ where: { ...baseWhere, status: AttendanceStatus.EXCUSED } })
    ]);

    return {
      present,
      absent,
      late,
      excused
    };
  }
}
