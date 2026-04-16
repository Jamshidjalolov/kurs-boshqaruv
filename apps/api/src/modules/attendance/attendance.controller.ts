import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { AttendanceService } from "./attendance.service";
import { MarkAttendanceDto } from "./dto/attendance.dto";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post("mark")
  mark(@Body() dto: MarkAttendanceDto, @Req() req: AuthRequest) {
    return this.attendanceService.mark(dto, req.user!);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get("group/:groupId")
  getGroupAttendance(
    @Param("groupId") groupId: string,
    @Query("sessionDate") sessionDate: string | undefined,
    @Req() req: AuthRequest
  ) {
    return this.attendanceService.getGroupAttendance(groupId, sessionDate, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get("summary")
  getSummary(@Req() req: AuthRequest) {
    return this.attendanceService.getSummary(req.user);
  }
}
