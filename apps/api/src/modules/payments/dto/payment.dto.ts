import { PartialType } from "@nestjs/swagger";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from "class-validator";

export class CreatePaymentDto {
  @IsString()
  studentId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  month!: number;

  @IsNumber()
  @Min(2024)
  year!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
