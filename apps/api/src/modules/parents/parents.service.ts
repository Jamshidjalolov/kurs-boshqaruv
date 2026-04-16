import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.parent.findMany({
      where: { deletedAt: null },
      include: {
        students: true
      },
      orderBy: { createdAt: "desc" }
    });
  }
}
