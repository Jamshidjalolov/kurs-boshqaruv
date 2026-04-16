import { AttendanceStatus } from "@prisma/client";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

export class AttendanceRecordDto {
  @IsString()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class MarkAttendanceDto {
  @IsString()
  groupId!: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsDateString()
  sessionDate!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}
