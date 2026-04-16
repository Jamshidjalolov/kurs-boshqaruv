import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthRequest } from "../../common/guards/jwt-auth.guard";
import { CreatePaymentDto, UpdatePaymentDto } from "./dto/payment.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get()
  findAll(@Query() query: Record<string, unknown>, @Req() req: AuthRequest) {
    return this.paymentsService.findAll(query, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get("unpaid")
  findUnpaid(@Query() query: Record<string, unknown>, @Req() req: AuthRequest) {
    return this.paymentsService.findUnpaid(query, req.user);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreatePaymentDto, @Req() req: AuthRequest) {
    return this.paymentsService.create(dto, req.user?.sub);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePaymentDto, @Req() req: AuthRequest) {
    return this.paymentsService.update(id, dto, req.user?.sub);
  }
}
