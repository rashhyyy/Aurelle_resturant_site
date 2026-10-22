import crypto from 'crypto';

/**
 * Generates a cryptographically secure random hexadecimal token.
 */
export const generateRandomToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const generateSecureToken = generateRandomToken;

/**
 * Creates a SHA-256 hash of a token for secure database storage.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
