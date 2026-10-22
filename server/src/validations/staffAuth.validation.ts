import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email('A valid staff email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'New password must not exceed 128 characters'),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().trim().email('A valid staff email address is required'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'New password must not exceed 128 characters'),
  }),
};
