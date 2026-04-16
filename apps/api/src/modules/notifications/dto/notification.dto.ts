import { NotificationChannel } from "@prisma/client";
import { IsObject, IsOptional, IsString } from "class-validator";

export class SendParentAlertDto {
  @IsString()
  studentId!: string;

  @IsOptional()
  @IsString()
  templateKey?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, string | number | boolean | null>;
}

export class UpdateNotificationTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  content!: string;

  @IsOptional()
  channel?: NotificationChannel;
}
