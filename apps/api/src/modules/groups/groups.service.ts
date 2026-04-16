import { Injectable, NotFoundException } from "@nestjs/common";
import { GroupStatus, UserRole } from "@prisma/client";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateGroupDto, UpdateGroupDto } from "./dto/group.dto";

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user?: AuthRequest["user"]) {
    return this.prisma.group.findMany({
      where: {
        deletedAt: null,
        ...(user?.role === UserRole.TEACHER ? { teacher: { userId: user.sub } } : {}),
        ...(user?.role === UserRole.STUDENT
          ? { memberships: { some: { student: { userId: user.sub } } } }
          : {})
      },
      include: {
        course: true,
        teacher: true,
        memberships: { include: { student: true } },
        schedules: true,
        _count: { select: { memberships: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async findOne(id: string, user?: AuthRequest["user"]) {
    const group = await this.prisma.group.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user?.role === UserRole.TEACHER ? { teacher: { userId: user.sub } } : {}),
        ...(user?.role === UserRole.STUDENT
          ? { memberships: { some: { student: { userId: user.sub } } } }
          : {})
      },
      include: {
        course: true,
        teacher: true,
        memberships: {
          include: {
            student: {
              include: {
                payments: {
                  orderBy: [{ year: "desc" }, { month: "desc" }],
                  take: 1
                }
              }
            }
          }
        },
        attendances: {
          orderBy: { sessionDate: "desc" },
          take: 30,
          include: { student: true }
        },
        schedules: true
      }
    });

    if (!group) {
      throw new NotFoundException("Group not found.");
    }

    return group;
  }

  create(dto: CreateGroupDto, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.name,
          courseId: dto.courseId,
          teacherId: dto.teacherId,
          room: dto.room,
          capacity: dto.capacity ?? 16,
          scheduleDays: dto.scheduleDays,
          scheduleTime: dto.scheduleTime,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: dto.status ?? GroupStatus.ACTIVE
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "GROUP_CREATED",
          entityType: "Group",
          entityId: group.id
        }
      });

      return group;
    });
  }

  update(id: string, dto: UpdateGroupDto, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.update({
        where: { id },
        data: {
          name: dto.name,
          courseId: dto.courseId,
          teacherId: dto.teacherId,
          room: dto.room,
          capacity: dto.capacity,
          scheduleDays: dto.scheduleDays,
          scheduleTime: dto.scheduleTime,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: dto.status
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "GROUP_UPDATED",
          entityType: "Group",
          entityId: id
        }
      });

      return group;
    });
  }

  remove(id: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.group.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: GroupStatus.ARCHIVED
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "GROUP_DELETED",
          entityType: "Group",
          entityId: id
        }
      });

      return { message: "Group archived successfully." };
    });
  }
}
