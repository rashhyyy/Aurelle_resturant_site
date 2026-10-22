import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Staff } from '../models/staff.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus, STAFF_PERMISSIONS } from '../types/staff';
import { generateSecureToken, hashToken } from '../utils/token';
import { emailService } from '../services/email.service';
import { revokeStaffSessions } from '../utils/sessionRevocation';
import { recordStaffAudit } from '../utils/auditLogger';
import { RESTAURANT_LOCATIONS, getLocationName } from '../config/locations';
import {
  createStaffInvitationSchema,
  updateStaffProfileSchema,
  updateStaffRoleSchema,
  updateStaffLocationsSchema,
  updateStaffStatusSchema,
} from '../validations/adminStaff.validation';

/**
 * 1. GET /api/admin/staff/summary
 * Aggregates high-level staff counts across the platform or filtered by location.
 */
export const getStaffSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { locationId } = req.query;

    const baseFilter: Record<string, any> = {};
    if (locationId && typeof locationId === 'string' && locationId !== 'all') {
      baseFilter.locationIds = locationId;
    }

    const [total, active, invited, disabled] = await Promise.all([
      Staff.countDocuments(baseFilter),
      Staff.countDocuments({ ...baseFilter, status: StaffStatus.ACTIVE }),
      Staff.countDocuments({ ...baseFilter, status: StaffStatus.INVITED }),
      Staff.countDocuments({ ...baseFilter, status: StaffStatus.DISABLED }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        invited,
        disabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/admin/staff
 * Searchable, filterable, and paginated staff directory.
 */
export const getStaffList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      role,
      status,
      locationId,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const queryFilter: Record<string, any> = {};

    // 1. Text Search across first name, last name, and email
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = search.trim();
      const searchRegex = new RegExp(sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      queryFilter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // 2. Role Filter
    if (role && typeof role === 'string' && role !== 'ALL' && Object.values(StaffRole).includes(role as StaffRole)) {
      queryFilter.role = role;
    }

    // 3. Status Filter
    if (status && typeof status === 'string' && status !== 'ALL' && Object.values(StaffStatus).includes(status as StaffStatus)) {
      queryFilter.status = status;
    }

    // 4. Location Filter
    if (locationId && typeof locationId === 'string' && locationId !== 'all') {
      queryFilter.locationIds = locationId;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Allowed sort fields
    const validSortFields: Record<string, string> = {
      name: 'firstName',
      role: 'role',
      status: 'status',
      lastLoginAt: 'lastLoginAt',
      createdAt: 'createdAt',
    };

    const sortField = validSortFields[sortBy as string] || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [staffRecords, totalCount] = await Promise.all([
      Staff.find(queryFilter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      Staff.countDocuments(queryFilter),
    ]);

    const safeStaff = staffRecords.map((s) => s.toSafeJSON());

    res.status(200).json({
      success: true,
      data: {
        staff: safeStaff,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/admin/staff/permissions
 * Returns permissions matrix and configured locations for admin management UI.
 */
export const getRolePermissions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        permissionsMatrix: STAFF_PERMISSIONS,
        locations: RESTAURANT_LOCATIONS,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/admin/staff/:id
 * Retrieve a single employee's safe profile and recent activity.
 */
export const getStaffById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier format.' });
      return;
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    // Query recent audit logs for this specific staff member
    const recentActivity = await StaffAuditLog.find({ targetStaffId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    res.status(200).json({
      success: true,
      data: {
        staff: staff.toSafeJSON(),
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/admin/staff/invitations
 * Invite a new staff member, generate invitation token, dispatch email, and log audit event.
 */
export const createStaffInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = createStaffInvitationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { firstName, lastName, email, phone, role, locationIds } = parseResult.data;

    // Check if email already belongs to a staff account
    const existing = await Staff.findOne({ email });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A staff account with this email address already exists.',
      });
      return;
    }

    // Generate secure cryptographic invitation token (32 bytes hex)
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const newStaff = new Staff({
      firstName,
      lastName,
      email,
      phone: phone || null,
      role,
      status: StaffStatus.INVITED,
      locationIds,
      invitationTokenHash: tokenHash,
      invitationExpiresAt: expiresAt,
      invitationSentAt: new Date(),
    });

    await newStaff.save();

    // Dispatch invitation email
    const primaryLocationName = getLocationName(locationIds[0]);
    const emailResult = await emailService.sendStaffInvitation({
      toEmail: email,
      recipientName: `${firstName} ${lastName}`,
      roleName: role,
      locationName: primaryLocationName,
      invitationToken: rawToken,
      expiresInHours: 48,
    });

    // Record audit event
    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: newStaff._id.toString(),
      targetStaffName: `${firstName} ${lastName}`,
      targetStaffEmail: email,
      action: 'STAFF_INVITED',
      details: `Invited new employee as ${role} for venue(s): ${locationIds.join(', ')}`,
      metadata: { role, locationIds, emailDelivered: emailResult.delivered },
      locationId: locationIds[0],
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Staff invitation created successfully.',
      data: {
        staff: newStaff.toSafeJSON(),
        emailDelivery: {
          delivered: emailResult.delivered,
          simulated: emailResult.simulated,
          previewUrl: process.env.NODE_ENV !== 'production' ? emailResult.previewUrl : undefined,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. POST /api/admin/staff/:id/resend-invitation
 * Regenerates an invitation token for an invited staff member and re-dispatches the email.
 */
export const resendStaffInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const staff = await Staff.findById(id).select('+invitationTokenHash +invitationExpiresAt');
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    if (staff.status !== StaffStatus.INVITED) {
      res.status(400).json({
        success: false,
        message: `Cannot resend invitation for staff with status: ${staff.status}. Only INVITED accounts can receive invitations.`,
      });
      return;
    }

    // Rate limiting: prevent resending within 60 seconds
    if (staff.invitationSentAt && Date.now() - staff.invitationSentAt.getTime() < 60000) {
      res.status(429).json({
        success: false,
        message: 'Please wait at least 60 seconds before resending an invitation.',
      });
      return;
    }

    const rawToken = generateSecureToken();
    staff.invitationTokenHash = hashToken(rawToken);
    staff.invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    staff.invitationSentAt = new Date();
    await staff.save();

    const primaryLocationName = getLocationName(staff.locationIds[0] || 'loc-colombo-main');
    const emailResult = await emailService.sendStaffInvitation({
      toEmail: staff.email,
      recipientName: `${staff.firstName} ${staff.lastName}`,
      roleName: staff.role,
      locationName: primaryLocationName,
      invitationToken: rawToken,
      expiresInHours: 48,
    });

    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'INVITATION_RESENT',
      details: `Re-dispatched invitation to ${staff.email}`,
      metadata: { emailDelivered: emailResult.delivered },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully.',
      data: {
        staff: staff.toSafeJSON(),
        emailDelivery: {
          delivered: emailResult.delivered,
          simulated: emailResult.simulated,
          previewUrl: process.env.NODE_ENV !== 'production' ? emailResult.previewUrl : undefined,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. POST /api/admin/staff/:id/revoke-invitation
 * Cancels a pending invitation and disables the account.
 */
export const revokeStaffInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    if (staff.status !== StaffStatus.INVITED) {
      res.status(400).json({
        success: false,
        message: 'Only pending invitations with INVITED status can be revoked.',
      });
      return;
    }

    staff.status = StaffStatus.DISABLED;
    staff.invitationTokenHash = undefined;
    staff.invitationExpiresAt = undefined;
    await staff.save();

    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'INVITATION_REVOKED',
      details: `Revoked pending invitation for ${staff.email}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Invitation successfully revoked and account marked DISABLED.',
      data: {
        staff: staff.toSafeJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. PATCH /api/admin/staff/:id
 * Updates an employee's personal contact details.
 */
export const updateStaffProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const parseResult = updateStaffProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    const { firstName, lastName, phone } = parseResult.data;
    if (firstName !== undefined) staff.firstName = firstName;
    if (lastName !== undefined) staff.lastName = lastName;
    if (phone !== undefined) staff.phone = phone;

    await staff.save();

    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'PROFILE_UPDATED',
      details: `Updated personal profile details for ${staff.email}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully.',
      data: { staff: staff.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. PATCH /api/admin/staff/:id/role
 * Updates an employee's role with anti-lockout protection and session invalidation.
 */
export const updateStaffRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const parseResult = updateStaffRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { role: newRole } = parseResult.data;

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    // Anti-lockout: Prevent demoting the last active administrator
    if (staff.role === StaffRole.ADMIN && newRole !== StaffRole.ADMIN) {
      const activeAdminCount = await Staff.countDocuments({
        role: StaffRole.ADMIN,
        status: StaffStatus.ACTIVE,
      });

      if (activeAdminCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Operation rejected: Cannot demote the last active system administrator.',
        });
        return;
      }
    }

    const previousRole = staff.role;
    staff.role = newRole;
    await staff.save();

    // Revoke active sessions for target employee so permissions recalculate cleanly
    await revokeStaffSessions(staff._id.toString());

    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'ROLE_CHANGED',
      details: `Role changed from ${previousRole} to ${newRole}`,
      metadata: { previousRole, newRole },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Employee role updated to ${newRole}. Active sessions revoked.`,
      data: { staff: staff.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. PATCH /api/admin/staff/:id/locations
 * Assigns or updates restaurant locations for an employee.
 */
export const updateStaffLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const parseResult = updateStaffLocationsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { locationIds } = parseResult.data;

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    const previousLocations = staff.locationIds;
    staff.locationIds = locationIds;
    await staff.save();

    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'LOCATIONS_CHANGED',
      details: `Updated location access: ${locationIds.join(', ')}`,
      metadata: { previousLocations, newLocations: locationIds },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Assigned locations updated successfully.',
      data: { staff: staff.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. PATCH /api/admin/staff/:id/status
 * Enables or disables an employee account with anti-lockout check and instant session termination.
 */
export const updateStaffStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const parseResult = updateStaffStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { status: newStatus } = parseResult.data;

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    // Anti-lockout: Prevent disabling the last active administrator
    if (staff.role === StaffRole.ADMIN && newStatus === StaffStatus.DISABLED) {
      const activeAdminCount = await Staff.countDocuments({
        role: StaffRole.ADMIN,
        status: StaffStatus.ACTIVE,
      });

      if (activeAdminCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Operation rejected: Cannot disable the last active system administrator.',
        });
        return;
      }
    }

    const previousStatus = staff.status;
    staff.status = newStatus;
    await staff.save();

    // If disabling account, revoke all existing sessions immediately
    if (newStatus === StaffStatus.DISABLED) {
      await revokeStaffSessions(staff._id.toString());
    }

    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: newStatus === StaffStatus.DISABLED ? 'ACCOUNT_DISABLED' : 'ACCOUNT_ENABLED',
      details: `Account status transitioned from ${previousStatus} to ${newStatus}`,
      metadata: { previousStatus, newStatus },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Account status updated to ${newStatus}.${
        newStatus === StaffStatus.DISABLED ? ' Active sessions revoked.' : ''
      }`,
      data: { staff: staff.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 12. POST /api/admin/staff/:id/password-reset
 * Initiates an administrator-triggered secure password reset for an active employee.
 */
export const initiateStaffPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    if (staff.status !== StaffStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        message: 'Password reset can only be initiated for ACTIVE employee accounts.',
      });
      return;
    }

    const rawToken = generateSecureToken();
    staff.passwordResetTokenHash = hashToken(rawToken);
    staff.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await staff.save();

    const emailResult = await emailService.sendPasswordReset({
      toEmail: staff.email,
      recipientName: `${staff.firstName} ${staff.lastName}`,
      resetToken: rawToken,
      expiresInMinutes: 60,
    });

    const admin = req.session.staff!;
    await recordStaffAudit({
      actorId: admin.id,
      actorName: `${admin.firstName} ${admin.lastName}`,
      actorEmail: admin.email,
      targetStaffId: staff._id.toString(),
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'PASSWORD_RESET_INITIATED',
      details: `Administrator initiated password reset for ${staff.email}`,
      metadata: { emailDelivered: emailResult.delivered },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated and dispatched.',
      data: {
        emailDelivery: {
          delivered: emailResult.delivered,
          simulated: emailResult.simulated,
          previewUrl: process.env.NODE_ENV !== 'production' ? emailResult.previewUrl : undefined,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 13. GET /api/admin/staff/:id/activity
 * Retrieves paginated audit log entries for a specific staff member.
 */
export const getStaffActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff identifier.' });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [logs, totalCount] = await Promise.all([
      StaffAuditLog.find({ targetStaffId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      StaffAuditLog.countDocuments({ targetStaffId: id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
