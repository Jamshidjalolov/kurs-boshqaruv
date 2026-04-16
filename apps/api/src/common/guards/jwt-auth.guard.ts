import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { env } from "../../config/env";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    role: string;
    phone: string;
    fullName: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Access token is missing.");
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      request.user = (await this.jwtService.verifyAsync(token, {
        secret: env.jwtAccessSecret
      })) as AuthRequest["user"];

      return true;
    } catch {
      throw new UnauthorizedException("Access token is invalid or expired.");
    }
  }
}
