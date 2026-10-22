import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Revokes all active session documents associated with a specific staff account
 * across the MongoDB MongoStore sessions collection.
 */
export async function revokeStaffSessions(staffId: string): Promise<number> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return 0;
    }

    const collection = mongoose.connection.collection('sessions');

    // connect-mongo serializes session state to JSON in the 'session' field
    const result = await collection.deleteMany({
      $or: [
        { 'session.staff.id': staffId },
        { session: { $regex: `"id":"${staffId}"` } },
        { session: { $regex: `"staff":{[^}]*"id":"${staffId}"` } },
      ],
    });

    logger.info(`[SessionRevocation] Revoked ${result.deletedCount} active sessions for staff ID: ${staffId}`);
    return result.deletedCount;
  } catch (err: any) {
    logger.warn(`[SessionRevocation] Notice during session revocation for ${staffId}: ${err?.message || err}`);
    return 0;
  }
}
