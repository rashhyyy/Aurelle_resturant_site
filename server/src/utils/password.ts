import argon2 from 'argon2';

/**
 * Argon2id password hashing parameters according to OWASP guidelines:
 * - type: argon2id (hybrid mode combining Argon2d and Argon2i)
 * - memoryCost: 65536 KiB (64 MiB)
 * - timeCost: 3 iterations
 * - parallelism: 1 lane / thread
 */
const HASH_OPTIONS: argon2.HashOptions & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  raw: false,
};

/**
 * Hashes a plaintext password using Argon2id.
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  return await argon2.hash(plainPassword, HASH_OPTIONS);
};

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export const verifyPassword = async (
  hash: string,
  plainPassword: string
): Promise<boolean> => {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (error) {
    console.error('[Auth] Error verifying password:', error);
    return false;
  }
};
