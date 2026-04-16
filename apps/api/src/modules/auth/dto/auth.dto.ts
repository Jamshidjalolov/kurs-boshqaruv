import { UserRole } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from "class-validator";

const phoneRegex = /^\+?[0-9]{9,15}$/;

export class RegisterDto {
  @IsString()
  fullName!: string;

  @Matches(phoneRegex)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

export class LoginDto {
  @IsString()
  identifier!: string;

  @MinLength(6)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsString()
  identifier!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @MinLength(6)
  password!: string;
}
