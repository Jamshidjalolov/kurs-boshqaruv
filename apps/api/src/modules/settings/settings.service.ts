import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: "asc" }
    });

    return settings.reduce<Record<string, unknown>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  }

  async update(key: string, value: unknown, actorId?: string) {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: value as never },
      create: {
        key,
        value: value as never
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "SETTING_UPDATED",
        entityType: "SystemSetting",
        entityId: setting.id,
        meta: { key }
      }
    });

    return setting;
  }
}
