import { Injectable } from "@nestjs/common";
import { UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";

interface CreateAuthUserInput {
  fullName: string;
  phone: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  email?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        parent: true
      }
    });
  }

  findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ phone: identifier }, { email: identifier }]
      },
      include: {
        student: true,
        teacher: true,
        parent: true
      }
    });
  }

  async createAuthUser(input: CreateAuthUserInput) {
    const passwordHash = await bcrypt.hash(input.password, 10);

    return this.prisma.user.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        passwordHash,
        role: input.role,
        status: input.status ?? UserStatus.PENDING
      }
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  }

  async clearRefreshToken(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null }
    });
  }
}
