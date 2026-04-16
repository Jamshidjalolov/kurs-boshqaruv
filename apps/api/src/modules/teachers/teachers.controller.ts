import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { CreateTeacherDto, UpdateTeacherDto } from "./dto/teacher.dto";
import { TeachersService } from "./teachers.service";

@Controller("teachers")
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(@Query() query: Record<string, unknown>, @Req() req: AuthRequest) {
    return this.teachersService.findAll(query, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.teachersService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateTeacherDto, @Req() req: AuthRequest) {
    return this.teachersService.create(dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTeacherDto, @Req() req: AuthRequest) {
    return this.teachersService.update(id, dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.teachersService.remove(id, req.user?.sub);
  }
}
