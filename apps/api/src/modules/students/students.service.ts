import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceStatus, StudentStatus, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { AddTeacherNoteDto, CreateStudentDto, UpdateStudentDto } from "./dto/student.dto";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: Record<string, unknown>, user?: AuthRequest["user"]) {
    const search = typeof query.search === "string" ? query.search : undefined;
    const status = typeof query.status === "string" ? (query.status as StudentStatus) : undefined;

    return {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              { parentName: { contains: search, mode: "insensitive" as const } }
            ]
          }
        : {}),
      ...(user?.role === UserRole.TEACHER
        ? {
            memberships: {
              some: {
                group: {
                  teacher: {
                    userId: user.sub
                  }
                }
              }
            }
          }
        : {}),
      ...(user?.role === UserRole.STUDENT ? { userId: user.sub } : {})
    };
  }

  async findAll(query: Record<string, unknown>, user?: AuthRequest["user"]) {
    const page = Number.parseInt(String(query.page ?? "1"), 10);
    const limit = Number.parseInt(String(query.limit ?? "10"), 10);
    const where = this.buildWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        include: {
          course: true,
          parent: true,
          memberships: {
            include: {
              group: {
                include: {
                  course: true,
                  teacher: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.student.count({ where })
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string, user?: AuthRequest["user"]) {
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        ...this.buildWhere({}, user)
      },
      include: {
        course: true,
        parent: true,
        memberships: {
          include: {
            group: {
              include: {
                course: true,
                teacher: true
              }
            }
          }
        },
        attendances: {
          orderBy: { sessionDate: "desc" },
          take: 30,
          include: {
            group: true,
            teacher: true
          }
        },
        payments: {
          orderBy: [{ year: "desc" }, { month: "desc" }]
        },
        notes: {
          orderBy: { noteDate: "desc" },
          include: { teacher: true }
        }
      }
    });

    if (!student) {
      throw new NotFoundException("Student not found.");
    }

    return student;
  }

  async create(dto: CreateStudentDto, actorId?: string) {
    const existingStudent = await this.prisma.student.findUnique({ where: { phone: dto.phone } });
    if (existingStudent) {
      throw new BadRequestException("Student with this phone already exists.");
    }

    const parent =
      dto.parentPhone && dto.parentName
        ? await this.prisma.parent.upsert({
            where: { phone: dto.parentPhone },
            update: {
              fullName: dto.parentName,
              telegramChatId: dto.parentTelegramChatId
            },
            create: {
              fullName: dto.parentName,
              phone: dto.parentPhone,
              telegramChatId: dto.parentTelegramChatId
            }
          })
        : null;

    const user = dto.password
      ? await this.prisma.user.create({
          data: {
            fullName: dto.fullName,
            phone: dto.phone,
            email: dto.email,
            passwordHash: await bcrypt.hash(dto.password, 10),
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE
          }
        })
      : null;

    const student = await this.prisma.student.create({
      data: {
        userId: user?.id,
        parentId: parent?.id,
        fullName: dto.fullName,
        phone: dto.phone,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        parentTelegramChatId: dto.parentTelegramChatId,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        address: dto.address,
        avatar: dto.avatar,
        status: dto.status ?? StudentStatus.ACTIVE,
        joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : undefined,
        courseId: dto.courseId,
        paymentPlan: dto.paymentPlan,
        monthlyFee: dto.monthlyFee,
        note: dto.note,
        memberships: dto.groupIds?.length
          ? {
              createMany: {
                data: dto.groupIds.map((groupId) => ({ groupId }))
              }
            }
          : undefined
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "STUDENT_CREATED",
        entityType: "Student",
        entityId: student.id,
        meta: { groupIds: dto.groupIds ?? [] }
      }
    });

    return this.findOne(student.id);
  }

  async update(id: string, dto: UpdateStudentDto, actorId?: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException("Student not found.");
    }

    const parent =
      dto.parentPhone && dto.parentName
        ? await this.prisma.parent.upsert({
            where: { phone: dto.parentPhone },
            update: {
              fullName: dto.parentName,
              telegramChatId: dto.parentTelegramChatId
            },
            create: {
              fullName: dto.parentName,
              phone: dto.parentPhone,
              telegramChatId: dto.parentTelegramChatId
            }
          })
        : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: {
          parentId: parent?.id ?? existing.parentId,
          fullName: dto.fullName,
          phone: dto.phone,
          parentName: dto.parentName,
          parentPhone: dto.parentPhone,
          parentTelegramChatId: dto.parentTelegramChatId,
          gender: dto.gender,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          address: dto.address,
          avatar: dto.avatar,
          status: dto.status,
          joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : undefined,
          courseId: dto.courseId,
          paymentPlan: dto.paymentPlan,
          monthlyFee: dto.monthlyFee,
          note: dto.note
        }
      });

      if (dto.groupIds) {
        await tx.studentGroup.deleteMany({ where: { studentId: id } });
        await tx.studentGroup.createMany({
          data: dto.groupIds.map((groupId) => ({ studentId: id, groupId }))
        });
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "STUDENT_UPDATED",
        entityType: "Student",
        entityId: id
      }
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: StudentStatus.INACTIVE
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "STUDENT_DELETED",
        entityType: "Student",
        entityId: id
      }
    });

    return { message: "Student archived successfully." };
  }

  private async resolveTeacherId(actorId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { OR: [{ userId: actorId }, { id: actorId }] }
    });

    if (!teacher) {
      throw new BadRequestException("Teacher context could not be resolved.");
    }

    return teacher.id;
  }

  async addTeacherNote(studentId: string, dto: AddTeacherNoteDto, actorId: string) {
    const teacherId = await this.resolveTeacherId(actorId);

    const note = await this.prisma.teacherNote.create({
      data: {
        studentId,
        teacherId,
        tag: dto.tag,
        comment: dto.comment,
        notificationTriggered: Boolean(dto.notifyParent)
      },
      include: { teacher: true }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "TEACHER_NOTE_CREATED",
        entityType: "TeacherNote",
        entityId: note.id,
        meta: { studentId, tag: dto.tag }
      }
    });

    return note;
  }

  async getRiskStudents() {
    const repeatedAbsences = await this.prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        status: { in: [AttendanceStatus.ABSENT, AttendanceStatus.LATE] },
        sessionDate: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        }
      },
      _count: { studentId: true },
      orderBy: {
        _count: {
          studentId: "desc"
        }
      },
      take: 10
    });

    return Promise.all(
      repeatedAbsences.map(async (entry) => ({
        count: entry._count.studentId,
        student: await this.prisma.student.findUnique({
          where: { id: entry.studentId }
        })
      }))
    );
  }
}
