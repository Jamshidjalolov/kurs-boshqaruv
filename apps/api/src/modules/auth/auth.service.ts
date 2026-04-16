import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { StudentStatus, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  private sanitizeUser<T extends { passwordHash?: string | null; refreshTokenHash?: string | null }>(
    user: T
  ) {
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }

  private async issueTokens(user: { id: string; role: UserRole; phone: string; fullName: string }) {
    const payload = {
      sub: user.id,
      role: user.role,
      phone: user.phone,
      fullName: user.fullName
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: env.jwtAccessSecret,
        expiresIn: env.jwtAccessTtl
      }),
      this.jwtService.signAsync(payload, {
        secret: env.jwtRefreshSecret,
        expiresIn: env.jwtRefreshTtl
      })
    ]);

    await this.usersService.updateRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.ADMIN || dto.role === UserRole.PARENT) {
      throw new BadRequestException("Admin and parent accounts require a secure internal flow.");
    }

    const existing = await this.usersService.findByIdentifier(dto.phone);
    if (existing) {
      throw new BadRequestException("A user with this phone already exists.");
    }

    const user = await this.usersService.createAuthUser({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      password: dto.password,
      role: dto.role,
      status: UserStatus.PENDING
    });

    if (dto.role === UserRole.STUDENT) {
      await this.prisma.student.create({
        data: {
          userId: user.id,
          fullName: dto.fullName,
          phone: dto.phone,
          status: StudentStatus.ACTIVE
        }
      });
    }

    if (dto.role === UserRole.TEACHER) {
      await this.prisma.teacher.create({
        data: {
          userId: user.id,
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email
        }
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "AUTH_REGISTER",
        entityType: "User",
        entityId: user.id,
        meta: { role: dto.role, status: UserStatus.PENDING }
      }
    });

    return {
      message: "Registration created. Account is pending approval.",
      user: this.sanitizeUser(user)
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentifier(dto.identifier);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Your account is not active yet.");
    }

    const tokens = await this.issueTokens(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: {
      sub: string;
      role: UserRole;
      phone: string;
      fullName: string;
    };

    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: env.jwtRefreshSecret
      });
    } catch {
      throw new UnauthorizedException("Refresh token is not valid.");
    }

    const userId = payload.sub;
    const user = await this.usersService.findById(userId);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException("Refresh token is not valid.");
    }

    const validToken = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!validToken) {
      throw new UnauthorizedException("Refresh token is not valid.");
    }

    return {
      user: this.sanitizeUser(user),
      tokens: await this.issueTokens(user)
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found.");
    }

    return this.sanitizeUser(user);
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
    return { message: "Logged out successfully." };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByIdentifier(dto.identifier);

    if (!user) {
      return { message: "If an account exists, reset instructions have been generated." };
    }

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      }
    });

    return {
      message: "Password reset token generated.",
      token
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException("Reset token is invalid or expired.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: await bcrypt.hash(dto.password, 10)
        }
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    return { message: "Password updated successfully." };
  }
}
