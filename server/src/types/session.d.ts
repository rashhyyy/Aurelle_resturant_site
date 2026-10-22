import 'express-session';
import { StaffRole, StaffStatus, SafeStaff } from './staff';

declare module 'express-session' {
  interface SessionData {
    // Customer session
    user?: {
      id: string;
      email: string;
      username: string;
      role: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
    // Staff session
    staff?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: StaffRole;
      status: StaffStatus;
      locationIds: string[];
    };
    // Anti-CSRF secret
    csrfToken?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      staff?: SafeStaff;
    }
  }
}
