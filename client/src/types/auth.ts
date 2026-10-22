export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  errors?: Record<string, string[]>;
}

export interface MeResponse {
  success: boolean;
  authenticated: boolean;
  user: User | null;
}
