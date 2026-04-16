import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { TeacherStatus, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTeacherDto, UpdateTeacherDto } from "./dto/teacher.dto";

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: Record<string, unknown>, user?: AuthRequest["user"]) {
    const search = typeof query.search === "string" ? query.search : undefined;

    return this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
                { specialization: { contains: search, mode: "insensitive" as const } }
              ]
            }
          : {}),
        ...(user?.role === UserRole.TEACHER ? { userId: user.sub } : {})
      },
      include: {
        groups: {
          include: {
            course: true,
            _count: {
              select: { memberships: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            course: true,
            memberships: {
              include: {
                student: true
              }
            }
          }
        },
        notes: {
          include: {
            student: true
          }
        }
      }
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException("Teacher not found.");
    }

    return teacher;
  }

  async create(dto: CreateTeacherDto, actorId?: string) {
    const existing = await this.prisma.teacher.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new BadRequestException("Teacher with this phone already exists.");
    }

    const user = dto.password
      ? await this.prisma.user.create({
          data: {
            fullName: dto.fullName,
            phone: dto.phone,
            email: dto.email,
            passwordHash: await bcrypt.hash(dto.password, 10),
            role: UserRole.TEACHER,
            status: UserStatus.ACTIVE
          }
        })
      : null;

    const teacher = await this.prisma.teacher.create({
      data: {
        userId: user?.id,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        specialization: dto.specialization,
        avatar: dto.avatar,
        salaryType: dto.salaryType,
        salaryAmount: dto.salaryAmount,
        status: dto.status ?? TeacherStatus.ACTIVE
      }
    });

    if (dto.assignedGroupIds?.length) {
      await this.prisma.group.updateMany({
        where: { id: { in: dto.assignedGroupIds } },
        data: { teacherId: teacher.id }
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "TEACHER_CREATED",
        entityType: "Teacher",
        entityId: teacher.id
      }
    });

    return this.findOne(teacher.id);
  }

  async update(id: string, dto: UpdateTeacherDto, actorId?: string) {
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException("Teacher not found.");
    }

    await this.prisma.teacher.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        specialization: dto.specialization,
        avatar: dto.avatar,
        salaryType: dto.salaryType,
        salaryAmount: dto.salaryAmount,
        status: dto.status
      }
    });

    if (dto.assignedGroupIds) {
      await this.prisma.group.updateMany({
        where: { teacherId: id },
        data: { teacherId: null }
      });
      await this.prisma.group.updateMany({
        where: { id: { in: dto.assignedGroupIds } },
        data: { teacherId: id }
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "TEACHER_UPDATED",
        entityType: "Teacher",
        entityId: id
      }
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: TeacherStatus.INACTIVE
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "TEACHER_DELETED",
        entityType: "Teacher",
        entityId: id
      }
    });

    return { message: "Teacher archived successfully." };
  }
}
