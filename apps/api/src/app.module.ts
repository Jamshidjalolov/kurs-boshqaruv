import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "./prisma/prisma.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { StudentsModule } from "./modules/students/students.module";
import { TeachersModule } from "./modules/teachers/teachers.module";
import { ParentsModule } from "./modules/parents/parents.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    ParentsModule,
    GroupsModule,
    CoursesModule,
    AttendanceModule,
    PaymentsModule,
    NotificationsModule,
    ReportsModule,
    SettingsModule,
    DashboardModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
