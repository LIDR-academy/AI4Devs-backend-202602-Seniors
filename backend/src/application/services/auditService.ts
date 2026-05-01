import { PrismaClient } from '@prisma/client';

type AuditPrismaClient = Pick<PrismaClient, 'auditLog'>;

export class AuditService {
  constructor(private readonly prisma: AuditPrismaClient) {}

  async logStageChange(
    applicationId: number,
    userId: number,
    oldStageId: number | null,
    newStageId: number,
    notes?: string
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: 'STAGE_UPDATE',
        userId,
        applicationId,
        oldStageId,
        newStageId,
        timestamp: new Date(),
        details: notes ? { notes } : undefined,
      },
    });
  }
}
