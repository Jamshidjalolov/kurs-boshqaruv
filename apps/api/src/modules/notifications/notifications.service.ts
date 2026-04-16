import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { SendParentAlertDto, UpdateNotificationTemplateDto } from "./dto/notification.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  listHistory() {
    return this.prisma.notification.findMany({
      include: {
        student: true,
        parent: true,
        template: true,
        sender: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  listTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { name: "asc" }
    });
  }

  updateTemplate(id: string, dto: UpdateNotificationTemplateDto) {
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        content: dto.content,
        channel: dto.channel ?? NotificationChannel.TELEGRAM
      }
    });
  }

  private renderMessage(template: string, context: Record<string, unknown>) {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = context[key];
      return value === undefined || value === null ? "" : String(value);
    });
  }

  async sendParentAlert(dto: SendParentAlertDto, senderId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { parent: true }
    });

    if (!student) {
      throw new NotFoundException("Student not found.");
    }

    const template = dto.templateKey
      ? await this.prisma.notificationTemplate.findUnique({
          where: { key: dto.templateKey }
        })
      : null;

    const recipient = student.parentTelegramChatId ?? student.parent?.telegramChatId;

    if (!recipient) {
      throw new BadRequestException("Parent Telegram chat id is not set.");
    }

    const message = dto.message
      ? dto.message
      : template
        ? this.renderMessage(template.content, {
            studentName: student.fullName,
            centerName: env.centerName,
            month: new Date().toLocaleString("en-US", { month: "long" }),
            ...dto.context
          })
        : null;

    if (!message) {
      throw new BadRequestException("Either message or templateKey is required.");
    }

    const notification = await this.prisma.notification.create({
      data: {
        studentId: student.id,
        parentId: student.parentId,
        senderId,
        templateId: template?.id,
        channel: NotificationChannel.TELEGRAM,
        recipient,
        message,
        status: NotificationStatus.PENDING,
        context: dto.context
      }
    });

    try {
      if (!env.telegramBotToken) {
        throw new Error("TELEGRAM_BOT_TOKEN is missing.");
      }

      const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: recipient,
          text: message
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram returned ${response.status}`);
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date()
        }
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: senderId,
          action: "NOTIFICATION_SENT",
          entityType: "Notification",
          entityId: notification.id,
          meta: { recipient }
        }
      });

      return {
        message: "Notification sent successfully.",
        notificationId: notification.id
      };
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "Unknown notification error"
        }
      });

      throw error;
    }
  }
}
