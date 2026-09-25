import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditProcessor } from './audit.processor';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: 'audit' }),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditProcessor],
  exports: [AuditService],
})
export class AuditModule {}
