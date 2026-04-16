import { Controller, Get } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { ParentsService } from "./parents.service";

@Controller("parents")
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.parentsService.findAll();
  }
}
