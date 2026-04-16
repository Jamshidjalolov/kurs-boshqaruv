import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { CreateGroupDto, UpdateGroupDto } from "./dto/group.dto";
import { GroupsService } from "./groups.service";

@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.groupsService.findAll(req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.groupsService.findOne(id, req.user);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateGroupDto, @Req() req: AuthRequest) {
    return this.groupsService.create(dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGroupDto, @Req() req: AuthRequest) {
    return this.groupsService.update(id, dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.groupsService.remove(id, req.user?.sub);
  }
}
