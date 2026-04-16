import { PartialType } from "@nestjs/swagger";
import { GroupStatus } from "@prisma/client";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from "class-validator";

export class CreateGroupDto {
  @IsString()
  name!: string;

  @IsString()
  courseId!: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsArray()
  scheduleDays!: string[];

  @IsString()
  scheduleTime!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
