import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { CreateCourseDto, UpdateCourseDto } from "./dto/course.dto";
import { CoursesService } from "./courses.service";

@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.coursesService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateCourseDto, @Req() req: AuthRequest) {
    return this.coursesService.create(dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCourseDto, @Req() req: AuthRequest) {
    return this.coursesService.update(id, dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.coursesService.remove(id, req.user?.sub);
  }
}
