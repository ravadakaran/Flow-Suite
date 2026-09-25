import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { AuditService, AuditPayload } from './audit.service';

@Processor('audit')
export class AuditProcessor {
  constructor(private auditService: AuditService) {}

  @Process('write')
  async handleWrite(job: Job<AuditPayload>) {
    await this.auditService.writeLog(job.data);
  }
}
