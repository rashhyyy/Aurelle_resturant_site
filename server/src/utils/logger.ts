/**
 * Safe Logger Utility for Aurelle Platform
 * Automatically redacts sensitive fields (passwords, tokens, credentials, card details).
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'passwordconfirm',
  'currentpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie',
  'session',
  'creditcard',
  'cvv',
  'cardnumber',
]);

/**
 * Deeply redacts sensitive keys from an object or array.
 */
export const redactSensitiveData = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Redact Bearer tokens in headers
    if (data.toLowerCase().startsWith('bearer ')) {
      return 'Bearer [REDACTED]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = redactSensitiveData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
};

/**
 * Mask database connection URIs so passwords are never logged in plain text.
 */
export const maskMongoUri = (uri: string): string => {
  try {
    // Match mongodb+srv://username:password@host or mongodb://username:password@host
    return uri.replace(
      /^(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i,
      '$1$2:*****@'
    );
  } catch {
    return '[PROTECTED_MONGO_URI]';
  }
};

export const logger = {
  info: (message: string, meta?: unknown) => {
    if (meta !== undefined) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, redactSensitiveData(meta));
    } else {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }
  },
  warn: (message: string, meta?: unknown) => {
    if (meta !== undefined) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, redactSensitiveData(meta));
    } else {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
  },
  error: (message: string, error?: unknown) => {
    if (error !== undefined) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, redactSensitiveData(error));
    } else {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    }
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      if (meta !== undefined) {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, redactSensitiveData(meta));
      } else {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
      }
    }
  },
};
