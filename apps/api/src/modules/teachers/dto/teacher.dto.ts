import { PartialType } from "@nestjs/swagger";
import { TeacherStatus } from "@prisma/client";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength
} from "class-validator";

const phoneRegex = /^\+?[0-9]{9,15}$/;

export class CreateTeacherDto {
  @IsString()
  fullName!: string;

  @Matches(phoneRegex)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  salaryType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryAmount?: number;

  @IsOptional()
  @IsArray()
  assignedGroupIds?: string[];

  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;

  @IsOptional()
  @MinLength(6)
  password?: string;
}

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {}
