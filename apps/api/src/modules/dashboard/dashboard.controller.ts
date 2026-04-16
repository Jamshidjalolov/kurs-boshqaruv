import { Controller, Get, Req } from "@nestjs/common";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: AuthRequest) {
    return this.dashboardService.getDashboard(req.user!);
  }
}
