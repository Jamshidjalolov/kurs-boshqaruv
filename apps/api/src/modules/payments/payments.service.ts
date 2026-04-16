import { Injectable } from "@nestjs/common";
import { PaymentStatus, UserRole } from "@prisma/client";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePaymentDto, UpdatePaymentDto } from "./dto/payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private scopedWhere(user?: AuthRequest["user"]) {
    return {
      ...(user?.role === UserRole.TEACHER
        ? {
            student: {
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
          }
        : {}),
      ...(user?.role === UserRole.STUDENT
        ? {
            student: {
              userId: user.sub
            }
          }
        : {})
    };
  }

  findAll(query: Record<string, unknown>, user?: AuthRequest["user"]) {
    const status = typeof query.status === "string" ? (query.status as PaymentStatus) : undefined;

    return this.prisma.payment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...this.scopedWhere(user)
      },
      include: {
        student: {
          include: {
            memberships: {
              include: {
                group: true
              }
            }
          }
        }
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { dueDate: "asc" }]
    });
  }

  findUnpaid(query: Record<string, unknown>, user?: AuthRequest["user"]) {
    const overdueDays = Number.parseInt(String(query.overdueDays ?? "0"), 10);
    const overdueBoundary = new Date();
    overdueBoundary.setDate(overdueBoundary.getDate() - overdueDays);

    return this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.UNPAID, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL] },
        dueDate: overdueDays > 0 ? { lt: overdueBoundary } : undefined,
        ...this.scopedWhere(user)
      },
      include: {
        student: true
      },
      orderBy: { dueDate: "asc" }
    });
  }

  create(dto: CreatePaymentDto, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentId: dto.studentId,
          amount: dto.amount,
          dueDate: new Date(dto.dueDate),
          paidDate: dto.paidDate ? new Date(dto.paidDate) : undefined,
          month: dto.month,
          year: dto.year,
          paymentMethod: dto.paymentMethod,
          status:
            dto.status ??
            (dto.paidDate ? PaymentStatus.PAID : new Date(dto.dueDate) < new Date() ? PaymentStatus.OVERDUE : PaymentStatus.UNPAID),
          note: dto.note,
          receiptNumber: dto.receiptNumber,
          receiptUrl: dto.receiptUrl
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "PAYMENT_CREATED",
          entityType: "Payment",
          entityId: payment.id
        }
      });

      return payment;
    });
  }

  update(id: string, dto: UpdatePaymentDto, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id },
        data: {
          studentId: dto.studentId,
          amount: dto.amount,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          paidDate: dto.paidDate ? new Date(dto.paidDate) : undefined,
          month: dto.month,
          year: dto.year,
          paymentMethod: dto.paymentMethod,
          status: dto.status,
          note: dto.note,
          receiptNumber: dto.receiptNumber,
          receiptUrl: dto.receiptUrl
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "PAYMENT_UPDATED",
          entityType: "Payment",
          entityId: id
        }
      });

      return payment;
    });
  }
}
