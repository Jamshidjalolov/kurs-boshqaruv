import { PartialType } from "@nestjs/swagger";
import { NoteTag, StudentStatus } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength
} from "class-validator";

const phoneRegex = /^\+?[0-9]{9,15}$/;

export class CreateStudentDto {
  @IsString()
  fullName!: string;

  @Matches(phoneRegex)
  phone!: string;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @Matches(phoneRegex)
  parentPhone?: string;

  @IsOptional()
  @IsString()
  parentTelegramChatId?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsArray()
  groupIds?: string[];

  @IsOptional()
  @IsString()
  paymentPlan?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class AddTeacherNoteDto {
  @IsEnum(NoteTag)
  tag!: NoteTag;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  notifyParent?: boolean;
}
