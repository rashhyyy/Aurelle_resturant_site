import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffAuditAction } from '../types/staff';
import { logger } from './logger';

export interface RecordStaffAuditParams {
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetStaffId: string;
  targetStaffName: string;
  targetStaffEmail: string;
  action: StaffAuditAction;
  details: string;
  metadata?: Record<string, any>;
  locationId?: string;
  ipAddress?: string;
}

/**
 * Appends an enterprise audit log entry for staff management governance actions
 */
export async function recordStaffAudit(params: RecordStaffAuditParams): Promise<void> {
  try {
    await StaffAuditLog.create(params);
    logger.info(
      `[AuditLog] ${params.action} by ${params.actorEmail} on ${params.targetStaffEmail}: ${params.details}`
    );
  } catch (err: any) {
    logger.error('[AuditLog] Failed to persist staff audit entry:', err?.message || err);
  }
}

export const recordStaffAuditLog = recordStaffAudit;

