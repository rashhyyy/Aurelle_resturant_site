import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/user.model';
import { hashPassword, verifyPassword } from '../utils/password';
import { env } from '../config/env';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

const loginSchema = z
  .object({
    login: z.string().optional(),
    email: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => !!(data.login || data.email || data.username), {
    message: 'Username or email is required',
    path: ['login'],
  });

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, firstName, lastName, phone, countryCode, email, password } = parseResult.data;

    let finalUsername = username?.trim();
    if (!finalUsername) {
      const base = (firstName ? `${firstName}_${lastName || ''}` : email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 20);
      let candidate = base || 'guest';
      let count = 1;
      while (await User.findOne({ username: candidate })) {
        candidate = `${base.slice(0, 15)}_${count++}`;
      }
      finalUsername = candidate;
    }

    // Check existing email or username
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: finalUsername.toLowerCase() }],
    });

    if (existing) {
      const isEmail = existing.email.toLowerCase() === email.toLowerCase();
      res.status(409).json({
        success: false,
        message: isEmail
          ? 'An account with this email already exists'
          : 'Username is already taken',
      });
      return;
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      username: finalUsername,
      email: email.toLowerCase(),
      passwordHash,
      role: 'user',
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      phone: phone?.trim() || '',
      countryCode: countryCode?.trim() || 'Sri Lanka (+94)',
    });

    // Populate session
    req.session.user = {
      id: newUser._id.toString(),
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const loginIdentifier = (
      parseResult.data.login ||
      parseResult.data.email ||
      parseResult.data.username
    )!.trim();
    const { password } = parseResult.data;

    // Support login via email or username
    const user = await User.findOne({
      $or: [{ email: loginIdentifier.toLowerCase() }, { username: loginIdentifier }],
    }).select('+passwordHash');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Verify Argon2id hash
    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Store in session
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    };

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response, next: NextFunction): void => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie(env.SESSION_NAME, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    // Positive security pattern (prevents user enumeration while acknowledging request)
    res.status(200).json({
      success: true,
      message:
        'If an account exists for this email, password reset instructions have been dispatched.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session?.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { firstName, lastName, phone, countryCode, dateOfBirth } = req.body;
    const user = await User.findById(req.session.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (countryCode !== undefined) user.countryCode = countryCode;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;

    await user.save();

    if (req.session.user) {
      req.session.user.firstName = user.firstName;
      req.session.user.lastName = user.lastName;
      req.session.user.phone = user.phone;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session || !req.session.user) {
      res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
      return;
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy(() => {});
      res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      authenticated: true,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
