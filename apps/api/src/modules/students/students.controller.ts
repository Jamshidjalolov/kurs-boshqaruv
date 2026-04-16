import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { AddTeacherNoteDto, CreateStudentDto, UpdateStudentDto } from "./dto/student.dto";
import { StudentsService } from "./students.service";

@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get("insights/risk")
  getRiskStudents() {
    return this.studentsService.getRiskStudents();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(@Query() query: Record<string, unknown>, @Req() req: AuthRequest) {
    return this.studentsService.findAll(query, req.user);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateStudentDto, @Req() req: AuthRequest) {
    return this.studentsService.create(dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(":id/notes")
  addTeacherNote(@Param("id") id: string, @Body() dto: AddTeacherNoteDto, @Req() req: AuthRequest) {
    return this.studentsService.addTeacherNote(id, dto, req.user!.sub);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.studentsService.findOne(id, req.user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStudentDto, @Req() req: AuthRequest) {
    return this.studentsService.update(id, dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.studentsService.remove(id, req.user?.sub);
  }
}
