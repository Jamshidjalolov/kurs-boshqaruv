import { Body, Controller, Get, Param, Put, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Roles(UserRole.ADMIN)
  @Put(":key")
  update(@Param("key") key: string, @Body("value") value: unknown, @Req() req: AuthRequest) {
    return this.settingsService.update(key, value, req.user?.sub);
  }
}
