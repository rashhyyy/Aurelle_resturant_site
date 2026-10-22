import { Request, Response, NextFunction } from 'express';
import { Staff } from '../models/staff.model';
import { StaffStatus } from '../types/staff';
import { hashToken } from '../utils/token';
import { hashPassword } from '../utils/password';
import { recordStaffAudit } from '../utils/auditLogger';
import {
  validateInvitationSchema,
  acceptInvitationSchema,
} from '../validations/adminStaff.validation';

/**
 * Public Endpoint: POST /api/staff/invitations/validate
 * Validates an invitation token and returns safe basic employee context.
 */
export const validateInvitationToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = validateInvitationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid invitation token format.',
      });
      return;
    }

    const { token } = parseResult.data;
    const tokenHash = hashToken(token);

    const staff = await Staff.findOne({
      invitationTokenHash: tokenHash,
      status: StaffStatus.INVITED,
    }).select('+invitationTokenHash +invitationExpiresAt');

    if (!staff) {
      res.status(400).json({
        success: false,
        message: 'Invalid, used, or unrecognized invitation token.',
      });
      return;
    }

    if (staff.invitationExpiresAt && staff.invitationExpiresAt.getTime() < Date.now()) {
      res.status(400).json({
        success: false,
        message: 'This invitation has expired. Please contact restaurant administration for a new invitation.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
        locationIds: staff.locationIds,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Endpoint: POST /api/staff/invitations/accept
 * Verifies token, sets new password, and activates the staff account.
 */
export const acceptStaffInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = acceptInvitationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { token, password } = parseResult.data;
    const tokenHash = hashToken(token);

    const staff = await Staff.findOne({
      invitationTokenHash: tokenHash,
      status: StaffStatus.INVITED,
    }).select('+invitationTokenHash +invitationExpiresAt +passwordHash');

    if (!staff) {
      res.status(400).json({
        success: false,
        message: 'Invalid, revoked, or previously accepted invitation.',
      });
      return;
    }

    if (staff.invitationExpiresAt && staff.invitationExpiresAt.getTime() < Date.now()) {
      res.status(400).json({
        success: false,
        message: 'This invitation has expired. Please request a new invitation from your administrator.',
      });
      return;
    }

    // Hash the chosen password using Argon2id
    const newPasswordHash = await hashPassword(password);

    staff.passwordHash = newPasswordHash;
    staff.status = StaffStatus.ACTIVE;
    staff.invitationTokenHash = undefined;
    staff.invitationExpiresAt = undefined;
    staff.passwordChangedAt = new Date();
    await staff.save();

    // Record audit event
    await recordStaffAudit({
      actorId: staff._id.toString(),
      actorName: `${staff.firstName} ${staff.lastName}`,
      actorEmail: staff.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'INVITATION_ACCEPTED',
      details: `Employee completed invitation setup and activated account. Role: ${staff.role}`,
      metadata: { role: staff.role, locationIds: staff.locationIds },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Account successfully activated! You can now sign in to the Aurelle staff management portal.',
    });
  } catch (error) {
    next(error);
  }
};
