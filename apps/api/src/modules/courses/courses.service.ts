import { Injectable, NotFoundException } from "@nestjs/common";
import { CourseStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCourseDto, UpdateCourseDto } from "./dto/course.dto";

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.course.findMany({
      where: { deletedAt: null },
      include: {
        groups: {
          include: {
            teacher: true,
            _count: {
              select: { memberships: true }
            }
          }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            teacher: true,
            memberships: { include: { student: true } }
          }
        },
        students: true
      }
    });

    if (!course || course.deletedAt) {
      throw new NotFoundException("Course not found.");
    }

    return course;
  }

  create(dto: CreateCourseDto, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: dto.title,
          description: dto.description,
          duration: dto.duration,
          price: dto.price,
          level: dto.level,
          status: dto.status ?? CourseStatus.ACTIVE
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "COURSE_CREATED",
          entityType: "Course",
          entityId: course.id
        }
      });

      return course;
    });
  }

  update(id: string, dto: UpdateCourseDto, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          duration: dto.duration,
          price: dto.price,
          level: dto.level,
          status: dto.status
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "COURSE_UPDATED",
          entityType: "Course",
          entityId: id
        }
      });

      return course;
    });
  }

  remove(id: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: CourseStatus.ARCHIVED
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "COURSE_DELETED",
          entityType: "Course",
          entityId: id
        }
      });

      return { message: "Course archived successfully." };
    });
  }
}
