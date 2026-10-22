import { z } from 'zod';
import { StaffRole, StaffStatus } from '../types/staff';
import { VALID_LOCATION_IDS } from '../config/locations';

export const createStaffInvitationSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  phone: z.string().trim().max(25, 'Phone number cannot exceed 25 characters').optional().nullable(),
  role: z.nativeEnum(StaffRole, {
    errorMap: () => ({ message: 'Please select a valid staff role' }),
  }),
  locationIds: z
    .array(z.string().trim())
    .min(1, 'At least one restaurant location must be assigned')
    .refine(
      (ids) => ids.every((id) => VALID_LOCATION_IDS.includes(id)),
      { message: 'One or more assigned restaurant locations are invalid' }
    ),
});

export const updateStaffProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name cannot exceed 50 characters')
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name cannot exceed 50 characters')
    .optional(),
  phone: z.string().trim().max(25, 'Phone number cannot exceed 25 characters').optional().nullable(),
});

export const updateStaffRoleSchema = z.object({
  role: z.nativeEnum(StaffRole, {
    errorMap: () => ({ message: 'Please select a valid staff role' }),
  }),
});

export const updateStaffLocationsSchema = z.object({
  locationIds: z
    .array(z.string().trim())
    .min(1, 'At least one restaurant location must be assigned')
    .refine(
      (ids) => ids.every((id) => VALID_LOCATION_IDS.includes(id)),
      { message: 'One or more assigned restaurant locations are invalid' }
    ),
});

export const updateStaffStatusSchema = z.object({
  status: z.enum([StaffStatus.ACTIVE, StaffStatus.DISABLED], {
    errorMap: () => ({ message: 'Status must be set to ACTIVE or DISABLED' }),
  }),
});

export const validateInvitationSchema = z.object({
  token: z.string().trim().min(10, 'Invitation token is required'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(10, 'Invitation token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
