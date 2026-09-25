import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { MembersModule } from './modules/members/members.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CustomersModule } from './modules/customers/customers.module';
import { BillingModule } from './modules/billing/billing.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRootAsync({
      useFactory: () => {
        if (process.env.REDIS_URL) {
          try {
            const url = new URL(process.env.REDIS_URL);
            return {
              redis: {
                host: url.hostname,
                port: parseInt(url.port || '6379', 10),
                password: url.password ? decodeURIComponent(url.password) : undefined,
                username: url.username ? decodeURIComponent(url.username) : undefined,
                tls: url.protocol === 'rediss:' ? {} : undefined,
              },
            };
          } catch {
            return { redis: { host: '127.0.0.1', port: 6379 } };
          }
        }
        return {
          redis: {
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
          },
        };
      },
    }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    MembersModule,
    ProjectsModule,
    TasksModule,
    CustomersModule,
    BillingModule,
    EntitlementsModule,
    AuditModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/billing/webhook', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
