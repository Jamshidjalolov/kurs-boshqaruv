import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";
import { SendParentAlertDto, UpdateNotificationTemplateDto } from "./dto/notification.dto";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post("send-parent-alert")
  sendParentAlert(@Body() dto: SendParentAlertDto, @Req() req: AuthRequest) {
    return this.notificationsService.sendParentAlert(dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get("history")
  listHistory() {
    return this.notificationsService.listHistory();
  }

  @Roles(UserRole.ADMIN)
  @Get("templates")
  listTemplates() {
    return this.notificationsService.listTemplates();
  }

  @Roles(UserRole.ADMIN)
  @Patch("templates/:id")
  updateTemplate(@Param("id") id: string, @Body() dto: UpdateNotificationTemplateDto) {
    return this.notificationsService.updateTemplate(id, dto);
  }
}
